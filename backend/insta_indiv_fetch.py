import instaloader
import threading
from concurrent.futures import ThreadPoolExecutor
from queue import Queue
from tqdm import tqdm
import logging
from math import ceil
from dataclasses import dataclass
from typing import Set, List, Dict
import json
import os
import re

logger = logging.getLogger(__name__)


def extract_hashtags(caption):
    if not caption:
        return []
    return [
        re.sub(r'[^a-zA-Z0-9]', '', word.strip('#').strip().lower())
        for word in caption.split() if word.startswith('#')
    ]

def clean_caption(caption):
    return re.sub(r'[^a-zA-Z0-9\s]', '', caption) if caption else ""


def writer_thread(output_file: str, write_queue: Queue):
    """
    Writer thread that accumulates posts and writes them as a list of JSON objects
    """
    posts = []
    try:
        # Load existing data if file exists
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as f:
                try:
                    posts = json.load(f)
                    if not isinstance(posts, list):
                        posts = []
                except json.JSONDecodeError:
                    posts = []
        
        while True:
            post = write_queue.get()
            if post is None:  # Exit signal
                break
                
            posts.append(post)
            
            # Write the entire list to file periodically (every 10 posts)
            if len(posts) % 10 == 0:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(posts, f, indent=2, ensure_ascii=False)
        
        # Final write
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(posts, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"Error in writer thread: {e}")

@dataclass
class LoaderPair:
    primary: instaloader.Instaloader
    secondary: instaloader.Instaloader
    current_index: int = 0

    def get_current_loader(self):
        return self.primary if self.current_index == 0 else self.secondary

    def switch_loader(self):
        self.current_index = (self.current_index + 1) % 2
        return self.get_current_loader()

def fetch_posts_chunk(loader_pair: LoaderPair, profile_name: str, start_idx: int, end_idx: int, 
                     write_queue: Queue, shared_processed_ids: Set[str], 
                     chunk_processed_ids: Set[str]) -> int:
    """
    Fetch a specific chunk of posts using a pair of loaders with automatic failover
    """
    posts_fetched = 0
    current_post_index = start_idx
    retries = 0
    max_retries = 4  # Maximum number of retries per chunk (2 attempts per loader)
    
    while current_post_index < end_idx and retries < max_retries:
        try:
            current_loader = loader_pair.get_current_loader()
            profile = instaloader.Profile.from_username(current_loader.context, profile_name)
            
            for post in profile.get_posts():
                if posts_fetched < (current_post_index - start_idx):
                    posts_fetched += 1
                    continue
                    
                if current_post_index >= end_idx:
                    break
                    
                # Check both shared and chunk-specific processed IDs
                if post.shortcode in shared_processed_ids or post.shortcode in chunk_processed_ids:
                    continue

                post_type = "Carousel" if post.typename == "GraphSidecar" else "Reel" if post.is_video else "Image"
                post_urls = [node.display_url for node in post.get_sidecar_nodes()] if post_type == "Carousel" else [post.url]

                post_info = {
                    "username": profile_name,
                    "content": "",
                    "metadata": {
                        "likes": post.likes,
                        "comments": post.comments,
                        "views": post.video_view_count if post.is_video else 0,
                        "timestamp": post.date.strftime("%Y-%m-%d %H:%M:%S"),
                        "hashtags": extract_hashtags(post.caption),
                        "location": post.location.name if post.location else "",
                        "music": post.music_title if hasattr(post, 'music_title') else "",
                        "post_id": post.shortcode,
                        "type": post_type,
                        "urls": post_urls,
                        "caption": clean_caption(post.caption),
                        "username": profile_name
                    }
                }

                write_queue.put(post_info)
                chunk_processed_ids.add(post.shortcode)
                shared_processed_ids.add(post.shortcode)
                current_post_index += 1
                posts_fetched += 1

        except instaloader.exceptions.TooManyRequestsException:
            logger.warning(f"Rate limit reached for chunk {start_idx}-{end_idx} on {'primary' if loader_pair.current_index == 0 else 'secondary'} loader")
            loader_pair.switch_loader()
            retries += 1
            if retries < max_retries:
                logger.info(f"Switching to {'primary' if loader_pair.current_index == 0 else 'secondary'} loader and continuing from post {current_post_index}")
            else:
                logger.error(f"All loaders exhausted for chunk {start_idx}-{end_idx}")
                break
                
        except Exception as e:
            logger.error(f"Error fetching chunk {start_idx}-{end_idx}: {e}")
            loader_pair.switch_loader()
            retries += 1
            if retries < max_retries:
                logger.info(f"Switching to {'primary' if loader_pair.current_index == 0 else 'secondary'} loader due to error")
            else:
                break

    return posts_fetched

def fetch_posts_parallel(profile_name: str, max_posts: int = 1000, 
                        output_file: str = "./live_data/data.json", 
                        num_workers: int = 5) -> int:
    """
    Fetch posts for a single profile using multiple workers, each with two loaders
    """
    write_queue = Queue()
    shared_processed_ids = set()  # Shared across all workers
    chunk_processed_ids = [set() for _ in range(num_workers)]  # Separate set for each chunk
    
    # Start writer thread
    writer = threading.Thread(target=writer_thread, args=(output_file, write_queue), daemon=True)
    writer.start()
    
    # Calculate chunk size for each worker
    chunk_size = ceil(max_posts / num_workers)
    chunks = [(i * chunk_size, min((i + 1) * chunk_size, max_posts)) 
              for i in range(num_workers)]
    
    # Create loader pairs for each worker
    loader_pairs = [
        LoaderPair(
            instaloader.Instaloader(),
            instaloader.Instaloader()
        ) for _ in range(num_workers)
    ]
    
    total_fetched = 0
    
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = []
        
        # Create progress bar
        with tqdm(total=max_posts, desc=f"Fetching posts for {profile_name}") as progress_bar:
            # Submit tasks for each chunk
            for i, (start, end) in enumerate(chunks):
                future = executor.submit(
                    fetch_posts_chunk,
                    loader_pairs[i],
                    profile_name,
                    start,
                    end,
                    write_queue,
                    shared_processed_ids,
                    chunk_processed_ids[i]
                )
                futures.append(future)
            
            # Wait for all chunks to complete
            for future in futures:
                try:
                    posts_fetched = future.result()
                    total_fetched += posts_fetched
                    progress_bar.update(posts_fetched)
                except Exception as e:
                    logger.error(f"Worker failed: {e}")
    
    # Signal writer thread to finish
    write_queue.put(None)
    writer.join()
    
    # Log completion statistics
    logger.info(f"Fetched total of {total_fetched} posts for {profile_name}")
    logger.info(f"Total unique posts processed: {len(shared_processed_ids)}")
    
    return total_fetched

# Example usage:
if __name__ == "__main__":
    profile_name = "iamsrk"
    total_posts = fetch_posts_parallel(
        profile_name,
        max_posts=100,
        num_workers=10
    )
    print(f"Successfully fetched {total_posts} posts")