import unittest

from check_comments import comments


class CommentLintTests(unittest.TestCase):
    def test_python_tokenizer_ignores_strings_and_shebang(self):
        self.assertEqual(comments("demo.py", '#!/usr/bin/env python3\nurl = "https://example.com"\n# stale\n'), [3])
        self.assertEqual(comments("demo.py", "x = 1 #! hidden\n"), [1])

    def test_shell_preserves_heredoc_and_length_expansion(self):
        source = '#!/usr/bin/env bash\nvalue=abc\necho ${#value}\ncat <<\'EOF\'\n# document heading\nEOF\ntrue;# workaround\n'
        self.assertEqual(comments("demo.sh", source), [7])
        self.assertEqual(comments("demo.sh", "printf '%s\\n' '<<EOF'\n# forbidden\n"), [2])
        self.assertEqual(comments("demo.sh", "echo ok # <<EOF\necho hi # hidden\n"), [1, 2])
        self.assertEqual(comments("demo.sh", "echo $((1 << 2))\n# forbidden\n"), [2])

    def test_yaml_and_gitignore_reject_headings(self):
        self.assertEqual(comments("workflow.yml", 'name: "# CI"\n# reason\nrun: command # note\n'), [2, 3])
        self.assertEqual(comments(".gitignore", "dist\n# output\n"), [2])


if __name__ == "__main__":
    unittest.main()
