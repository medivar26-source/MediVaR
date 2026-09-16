from supabase import create_client, Client

url = "https://eanuqinjawpkvwfojygx.supabase.co"
key = "sb_publishable_K3HFffY3S3UfI-hyo4hCkw_OG_exVmA"

print(f"Testing Supabase HTTP Client to {url}...")
try:
    supabase: Client = create_client(url, key)
    # Perform a simple check that doesn't require auth/tables - like checking if the REST API root responds
    import requests
    response = requests.get(url + "/rest/v1/")
    print("HTTP Request to REST root returned:", response.status_code)
except Exception as e:
    print(f"Supabase HTTP connection error: {e}")
