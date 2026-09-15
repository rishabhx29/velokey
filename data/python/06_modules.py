import math
import os
import sys
from collections import OrderedDict

print(f"Python version: {sys.version.split()[0]}")
print(f"Platform: {os.name}")

value = math.sqrt(144)
print(f"Square root of 144 is {value}")

circle_area = math.pi * 5 ** 2
print(f"Area of circle with radius 5: {circle_area:.2f}")

config = OrderedDict()
config["host"] = "localhost"
config["port"] = 8080
config["debug"] = True

for key, setting in config.items():
    print(f"{key} = {setting}")

path = os.path.join("folder", "subfolder", "file.txt")
print(f"Joined path: {path}")
