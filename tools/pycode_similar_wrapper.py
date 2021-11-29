#!/usr/bin/env python3
import pycode_similar
import os
import pathlib
import sys
import re

MINIMUM_SIMILARITY = 0.7

def wrap_around_function(str, function_name):
  indented_lines = ['\t' + line for line in str.split('\n')]
  return f"def {function_name}():\n" + "\n".join(indented_lines)

def get_matricula(filename):
  return filename[0:10]

files = [x for x in os.listdir() if x.endswith('.py')]
contents = [wrap_around_function(pathlib.Path(x).read_text(), get_matricula(x)) for x in files]

diffs = []
try:
  diffs = pycode_similar.detect(contents, diff_method=pycode_similar.UnifiedDiff, keep_prints=False, module_level=False)
except:
  pass

func_pattern = re.compile("a\\d{9}")
for i, diff in diffs:
  info = diff[0]
  name1, name2 = (info.info_ref.func_name, info.info_candidate.func_name, )
  if func_pattern.match(name1) and func_pattern.match(name2):
    similarity = info.plagiarism_count / info.total_count

    filename1 = [x for x in files if x.startswith(name1)][0]
    filename2 = [x for x in files if x.startswith(name2)][0]

    if similarity >= MINIMUM_SIMILARITY:
      print(filename1, filename2, f'{round(100 * similarity)}%', sep="\t")

