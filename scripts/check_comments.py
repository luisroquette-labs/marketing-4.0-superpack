import io
import re
import subprocess
import tokenize
from pathlib import Path


def comments(file, source):
    if file.endswith(".py"):
        return [token.start[0] for token in tokenize.generate_tokens(io.StringIO(source).readline)
                if token.type == tokenize.COMMENT and not (token.start == (1, 0) and token.string.startswith("#!"))]

    lines = []
    delimiter = None
    for number, line in enumerate(source.splitlines(), 1):
        if delimiter:
            if line.strip() == delimiter:
                delimiter = None
            continue
        if file.endswith(".sh"):
            if number == 1 and line.startswith("#!"):
                continue
            without_strings = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'',
                                     lambda item: " " * len(item.group()), line)
            comment = re.search(r"(^|[ \t;|&()])#", without_strings)
            if comment:
                lines.append(number)
                without_strings = without_strings[:comment.end() - 1]
            without_arithmetic = re.sub(r"\$?\(\(.*?\)\)",
                                        lambda item: " " * len(item.group()), without_strings)
            marker = re.search(r"<<-?", without_arithmetic)
            if marker:
                match = re.match(r"<<-?\s*(?:'(\w+)'|\"(\w+)\"|(\w+))", line[marker.start():])
                if match:
                    delimiter = next(value for value in match.groups() if value)
        elif file.endswith((".yml", ".yaml")):
            without_strings = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'',
                                     lambda item: " " * len(item.group()), line)
            if re.search(r"(^|\s)#", without_strings):
                lines.append(number)
        elif re.match(r"\s*#", line):
            lines.append(number)
    return lines


def main():
    tracked = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"])
    files = [Path(raw.decode()) for raw in tracked.split(b"\0") if raw]
    failures = []
    for file in files:
        if file.suffix not in {".py", ".sh", ".yml", ".yaml"} and file.name != ".gitignore":
            continue
        if not file.exists():
            continue
        failures.extend(f"{file}:{line}" for line in comments(str(file), file.read_text()))
    if failures:
        raise SystemExit("Comments are forbidden:\n" + "\n".join(failures))


if __name__ == "__main__":
    main()
