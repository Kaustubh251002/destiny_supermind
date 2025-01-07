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

# Ensure the directory exists
os.makedirs("./sample_data", exist_ok=True)

# Configure logging to print to the terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler()]  # Prints logs to the terminal
)
logger = logging.getLogger()

# Lock for thread-safe file writing
file_lock = threading.Lock()

# Buffer size for batch updates
BATCH_SIZE = 100

# Thread-safe queue for storing posts to be written
write_queue = queue.Queue()

# List of top Instagram influencers
top_influencers = [
    "instagram", "cristiano", "leomessi", "selenagomez", "kyliejenner",
    "therock", "arianagrande", "kimkardashian", "beyonce", "khloekardashian",
    "nike", "justinbieber", "kendalljenner", "taylorswift", "natgeo",
    "virat.kohli", 
    "jlo", "nickiminaj", "neymarjr", "kourtneykardash",
    "mileycyrus", "katyperry", "zendaya", "kevinhart4real", "realmadrid",
    "iamcardib", "kingjames", "ddlovato", "badgalriri", "chrisbrownofficial",
    "champagnepapi", "theellenshow", "fcbarcelona", "k.mbappe", "billieeilish",
    "championsleague", "gal_gadot", "lalalalisa_m", "vindiesel", "nasa",
    "shraddhakapoor", "priyankachopra", "narendramodi", "iamzlatanibrahimovic", "dualipa",
    "nba", "emmawatson", "gal_gadot", "shawnmendes", "harrystyles"
]


class CustomRateController(instaloader.RateController):
    def __init__(self, context):
        super().__init__(context)

    def handle_429(self, query_type: str) -> None:
        wait_time = self.query_waittime(query_type, time.time())
        logger.warning(f"Rate limit hit for '{query_type}'. Waiting for {wait_time:.2f} seconds...")
        self.sleep(wait_time)

    def sleep(self, secs: float):
        randomized_secs = secs + random.uniform(1, 3)  # Add random jitter
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

# Writing thread function
def writer_thread(output_file):
    batch = []
    while True:
        try:
            post = write_queue.get()
            if post is None:  # Termination signal
                break
            batch.append(post)
            if len(batch) >= BATCH_SIZE:
                write_batch_to_json(batch, output_file)
                batch.clear()
        except Exception as e:
            logger.error(f"Error in writer thread: {e}")
    # Write remaining posts
    if batch:
        write_batch_to_json(batch, output_file)

def write_batch_to_json(batch, output_file):
    with file_lock:
        try:
            if os.path.isfile(output_file):
                with open(output_file, "r", encoding="utf-8") as f:
                    try:
                        existing_data = json.load(f)
                    except json.JSONDecodeError:
                        logger.error(f"JSON decode error in {output_file}. Resetting file.")
                        existing_data = []
            else:
                existing_data = []

            # Append the batch of posts
            existing_data.extend(batch)

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(existing_data, f, indent=4)
        except Exception as e:
            logger.error(f"Error writing batch to JSON file: {e}")

def fetch_posts_for_profile(loaders, profile_name, max_posts=1000, processed_ids=None):
    processed_ids = processed_ids or set()
    loader_indices = [0] * len(loaders)
    current_loader = 0

    try:
        profile = instaloader.Profile.from_username(loaders[current_loader].context, profile_name)

        with tqdm(total=max_posts, desc=f"Fetching posts for {profile_name}") as progress_bar:
            while loader_indices[current_loader] < max_posts:
                try:
                    for post in profile.get_posts():
                        idx = loader_indices[current_loader]
                        if idx >= max_posts:
                            break
                        if post.shortcode in processed_ids:
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

                        write_queue.put(post_info)  # Add post to queue
                        processed_ids.add(post.shortcode)
                        loader_indices[current_loader] += 1
                        progress_bar.update(1)

                        if random.random() < 0.2:
                            delay = random.uniform(2, 5)
                            logger.info(f"Random delay of {delay:.2f} seconds.")
                            time.sleep(delay)

                        if loader_indices[current_loader] % 10 == 0:
                            current_loader = (current_loader + 1) % len(loaders)

                except instaloader.exceptions.TooManyRequestsException:
                    logger.warning(f"Rate limit reached for '{profile_name}' using loader {current_loader}. Switching loaders...")
                    current_loader = (current_loader + 1) % len(loaders)

        logger.info(f"Data for {profile_name} fetched successfully.")

    except instaloader.exceptions.ProfileNotExistsException:
        logger.warning(f"The profile '{profile_name}' does not exist.")

    except Exception as e:
        logger.error(f"Error fetching data for '{profile_name}': {e}")

def fetch_posts_parallel(profiles, max_posts=1000, output_file="./sample_data/all_influencers_data.json", num_workers=10, num_loaders=50):
    # Initialize loaders
    loaders = [instaloader.Instaloader(rate_controller=lambda ctx: CustomRateController(ctx)) for _ in range(num_loaders)]

    # Distribute loaders among workers
    loaders_per_worker = max(1, num_loaders // num_workers)
    profile_batches = [profiles[i::num_workers] for i in range(num_workers)]

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {
            executor.submit(
                fetch_posts_for_profiles_batch,
                loaders[i * loaders_per_worker: (i + 1) * loaders_per_worker],
                profile_batch,
                max_posts
            ): i for i, profile_batch in enumerate(profile_batches)
        }

        with tqdm(total=len(profiles), desc="Fetching Profiles") as pbar:
            for future in as_completed(futures):
                try:
                    future.result()
                    pbar.update(len(profile_batches[futures[future]]))
                except Exception as exc:
                    logger.error(f"Error in worker {futures[future]}: {exc}")
                    pbar.update(len(profile_batches[futures[future]]))

def fetch_posts_for_profiles_batch(loaders, profiles, max_posts):
    for profile in profiles:
        fetch_posts_for_profile(loaders, profile, max_posts)

if __name__ == "__main__":
    logger.info("Starting data fetch for top influencers...")

    # Start writer thread
    writer = threading.Thread(target=writer_thread, args=("./sample_data/all_influencers_data.json",), daemon=True)
    writer.start()

    try:
        fetch_posts_parallel(top_influencers, max_posts=1000, num_workers=34, num_loaders=60)
    finally:
        # Signal writer thread to finish
        write_queue.put(None)
        writer.join()

    logger.info("All data fetching complete. File saved in './sample_data/all_influencers_data.json'.")
