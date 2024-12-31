import instaloader
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

import os

# Ensure the directory exists
os.makedirs("./sample_data", exist_ok=True)

# List of top 20 Instagram influencers (replace with actual usernames)
top_influencers = [
    "cristiano", "kyliejenner", "leomessi", "selenagomez", "therock",
    "kimkardashian", "arianagrande", "beyonce", "justinbieber", "khloekardashian",
    "kendalljenner", "natgeo", "nike", "taylorswift", "neymarjr",
    "jlo", "mileycyrus", "katyperry", "ddlovato", "shakira"
]

def fetch_posts_for_profile(profile_name, max_posts=20):
    """
    Fetches the first 'max_posts' posts of the specified Instagram profile.
    Saves the data in a JSON file named '<profile_name>_posts.json'.
    """
    loader = instaloader.Instaloader()

    try:
        # Load the profile
        profile = instaloader.Profile.from_username(loader.context, profile_name)
        posts_data = []

        # Iterate through the profile's posts
        for idx, post in enumerate(profile.get_posts()):
            if idx >= max_posts:
                break

            post_type = "Carousel" if post.typename == "GraphSidecar" else "Reel" if post.is_video else "Image"

            post_info = {
                "id": post.shortcode,
                "caption": post.caption if post.caption else "",
                "type": post_type,
                "likes": post.likes,
                "comments": post.comments
            }

            posts_data.append(post_info)

        # Save to a JSON file
        with open(f"./sample_data/{profile_name}_posts.json", "w") as f:
            json.dump(posts_data, f, indent=4)

        print(f"Data for {profile_name} saved successfully.")
        return profile_name, "Success"
    
    except instaloader.exceptions.ProfileNotExistsException:
        print(f"The profile '{profile_name}' does not exist.")
        return profile_name, "Profile Not Found"
    
    except instaloader.exceptions.QueryReturnedNotFoundException:
        print(f"Failed to fetch data for profile '{profile_name}'.")
        return profile_name, "Query Error"
    
    except Exception as e:
        print(f"An error occurred for profile '{profile_name}': {e}")
        return profile_name, f"Error: {str(e)}"

def fetch_posts_parallel(profiles, max_posts=20):
    """
    Fetches posts for a list of profiles in parallel.
    """
    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:  # Limit workers to avoid rate limiting
        futures = {executor.submit(fetch_posts_for_profile, profile, max_posts): profile for profile in profiles}
        
        for future in as_completed(futures):
            profile_name = futures[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as exc:
                print(f"An error occurred for {profile_name}: {exc}")
                results.append((profile_name, "Error"))

    return results

# Run the script
if __name__ == "__main__":
    print("Starting data fetch for top influencers...")
    results = fetch_posts_parallel(top_influencers, max_posts=20)
    
    # Print summary
    print("\nSummary:")
    for profile_name, status in results:
        print(f"Profile: {profile_name}, Status: {status}")
