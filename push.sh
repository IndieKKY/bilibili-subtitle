#!/bin/bash

# Read the current version from package.json
current_version=$(cat package.json | grep '"version"' | cut -d'"' -f4)
echo "Current version: $current_version"

# Prompt the user to select which part of the version to upgrade
echo "Which part of the version do you want to upgrade?"
select part in "MAJOR" "MINOR" "PATCH"; do
    case $part in
        MAJOR) new_version=$(echo $current_version | awk 'BEGIN{FS=OFS="."} {$1+=1; $2=0; $3=0; print}'); break;;
        MINOR) new_version=$(echo $current_version | awk 'BEGIN{FS=OFS="."} {$2+=1; $3=0; print}'); break;;
        PATCH) new_version=$(echo $current_version | awk 'BEGIN{FS=OFS="."} {$3+=1; print}'); break;;
        *) echo "Invalid option";;
    esac
done

# Update the version in package.json
sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/g" package.json

echo "Version updated to: $new_version"

# build
pnpm run build
# zip dist
rm -f dist.zip
cd dist
zip -r ../dist.zip ./*
cd ../

# git
git add .
git commit -m "chore: release $new_version"
git push

# tag
git tag $new_version
git push origin $new_version

