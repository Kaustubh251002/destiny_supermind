import random
import time
import instaloader
import json
import os
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import re
import threading
import queue
from dataclasses import dataclass
from typing import Set, List, Dict
from math import ceil

# Configure logging and directories
os.makedirs("./sample_data", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger()

BATCH_SIZE = 100

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

class CustomRateController(instaloader.RateController):
    def __init__(self, context):
        super().__init__(context)

    def handle_429(self, query_type: str) -> None:
        wait_time = self.query_waittime(query_type, time.time())
        logger.warning(f"Rate limit hit for '{query_type}'. Waiting for {wait_time:.2f} seconds...")
        self.sleep(wait_time)

    def sleep(self, secs: float):
        randomized_secs = secs + random.uniform(1, 3)
        logger.info(f"Sleeping for {randomized_secs:.2f} seconds...")
        time.sleep(randomized_secs)

def extract_hashtags(caption):
    if not caption:
        return []
    return [
        re.sub(r'[^a-zA-Z0-9]', '', word.strip('#').strip().lower())
        for word in caption.split() if word.startswith('#')
    ]

def clean_caption(caption):
    return re.sub(r'[^a-zA-Z0-9\s]', '', caption) if caption else ""

def writer_thread(output_file: str):
    """Thread for batch writing posts to JSON file"""
    posts_buffer = []
    
    while True:
        try:
            post = write_queue.get()
            if post is None:  # Exit signal
                break
                
            posts_buffer.append(post)
            
            if len(posts_buffer) >= BATCH_SIZE:
                write_batch_to_json(posts_buffer, output_file)
                posts_buffer.clear()
                
        except Exception as e:
            logger.error(f"Error in writer thread: {e}")
    
    # Write remaining posts
    if posts_buffer:
        write_batch_to_json(posts_buffer, output_file)

def write_batch_to_json(batch: List[Dict], output_file: str):
    """Write a batch of posts to JSON file"""
    with threading.Lock():
        try:
            existing_data = []
            if os.path.isfile(output_file):
                with open(output_file, "r", encoding="utf-8") as f:
                    try:
                        existing_data = json.load(f)
                    except json.JSONDecodeError:
                        logger.error(f"JSON decode error in {output_file}. Resetting file.")

            existing_data.extend(batch)
            
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(existing_data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"Error writing batch to JSON file: {e}")

def fetch_profile_chunk(loader_pair: LoaderPair, profile_name: str, start_idx: int, end_idx: int, 
                       write_queue: queue.Queue, shared_processed_ids: Set[str]) -> int:
    """Fetch a chunk of posts from a profile using a loader pair"""
    posts_fetched = 0
    current_post_index = start_idx
    retries = 0
    max_retries = 4
    
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
                    
                if post.shortcode in shared_processed_ids:
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
                shared_processed_ids.add(post.shortcode)
                current_post_index += 1
                posts_fetched += 1

                # Random delay to avoid detection
                if random.random() < 0.2:
                    time.sleep(random.uniform(2, 5))

        except instaloader.exceptions.TooManyRequestsException:
            logger.warning(f"Rate limit for {profile_name} on {'primary' if loader_pair.current_index == 0 else 'secondary'} loader")
            loader_pair.switch_loader()
            retries += 1
            if retries < max_retries:
                logger.info(f"Switching loader for {profile_name}")
            else:
                logger.error(f"All loaders exhausted for {profile_name}")
                break
                
        except Exception as e:
            logger.error(f"Error fetching chunk for {profile_name}: {e}")
            loader_pair.switch_loader()
            retries += 1
            if retries < max_retries:
                logger.info(f"Switching loader due to error for {profile_name}")
            else:
                break

    return posts_fetched

def process_profile_batch(loader_pairs: List[LoaderPair], profiles: List[str], 
                         max_posts: int, shared_processed_ids: Set[str]):
    """Process a batch of profiles using multiple loader pairs"""
    posts_per_profile = max_posts
    chunks_per_profile = len(loader_pairs)
    chunk_size = ceil(posts_per_profile / chunks_per_profile)
    
    for profile in profiles:
        chunks = [(i * chunk_size, min((i + 1) * chunk_size, posts_per_profile)) 
                 for i in range(chunks_per_profile)]
        
        with ThreadPoolExecutor(max_workers=chunks_per_profile) as executor:
            futures = []
            
            with tqdm(total=posts_per_profile, desc=f"Fetching {profile}") as progress_bar:
                for i, (start, end) in enumerate(chunks):
                    future = executor.submit(
                        fetch_profile_chunk,
                        loader_pairs[i],
                        profile,
                        start,
                        end,
                        write_queue,
                        shared_processed_ids
                    )
                    futures.append(future)
                
                for future in as_completed(futures):
                    try:
                        posts_fetched = future.result()
                        progress_bar.update(posts_fetched)
                    except Exception as e:
                        logger.error(f"Error in worker: {e}")

def fetch_posts_parallel(profiles: List[str], max_posts: int = 1000,
                        output_file: str = "./sample_data/all_influencers_data.json",
                        num_workers: int = 5, pairs_per_worker: int = 2):
    """Main function to fetch posts from multiple profiles in parallel"""
    shared_processed_ids = set()
    write_queue = queue.Queue()
    
    # Start writer thread
    writer = threading.Thread(target=writer_thread, args=(output_file,), daemon=True)
    writer.start()
    
    # Create loader pairs for each worker
    all_loader_pairs = [
        [LoaderPair(
            instaloader.Instaloader(rate_controller=lambda ctx: CustomRateController(ctx)),
            instaloader.Instaloader(rate_controller=lambda ctx: CustomRateController(ctx))
        ) for _ in range(pairs_per_worker)]
        for _ in range(num_workers)
    ]
    
    # Split profiles into batches
    profile_batches = [profiles[i::num_workers] for i in range(num_workers)]
    
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = []
        for i, profile_batch in enumerate(profile_batches):
            future = executor.submit(
                process_profile_batch,
                all_loader_pairs[i],
                profile_batch,
                max_posts,
                shared_processed_ids
            )
            futures.append(future)
        
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                logger.error(f"Batch processing error: {e}")
    
    # Signal writer thread to finish
    write_queue.put(None)
    writer.join()
    
    logger.info(f"Completed fetching {len(profiles)} profiles")
    logger.info(f"Total unique posts: {len(shared_processed_ids)}")

if __name__ == "__main__":
    top_influencers = [
        "instagram", "cristiano", "leomessi", "selenagomez", "kyliejenner",
        "therock", "arianagrande", "kimkardashian", "beyonce", "khloekardashian",
        # ... rest of the influencers list
    ]
    
    logger.info("Starting data fetch for top influencers...")
    
    fetch_posts_parallel(
        profiles=top_influencers,
        max_posts=1000,
        num_workers=5,
        pairs_per_worker=2
    )
    
    logger.info("All data fetching complete.")