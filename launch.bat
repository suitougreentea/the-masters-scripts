git add .
git stash -m "Auto-stash before pulling changes"
git pull origin main

cd launcher && deno task start