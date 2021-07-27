#!/bin/bash

# ensure these pip packages on linux
# sudo apt-get install python3-tk python3-venv python3

python3 -m venv .venv
source ./.venv/bin/activate
pip freeze > requirements.txt
pip install -r requirements.txt
