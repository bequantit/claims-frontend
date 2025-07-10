import os

path = "data/EMC_vs_BRI/analysis_v7_gemini-2.5-pro.md"

with open(path, "r") as f:
    md = f.read()

print(md[18846:19056+1])




