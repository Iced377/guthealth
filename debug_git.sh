#!/bin/bash
echo "--- REMOTE ---" > debug_git_info.txt
git remote -v >> debug_git_info.txt
echo "--- BRANCH ---" >> debug_git_info.txt
git branch -vv >> debug_git_info.txt
echo "--- STATUS ---" >> debug_git_info.txt
git status >> debug_git_info.txt
