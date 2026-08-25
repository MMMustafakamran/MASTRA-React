# Project Context

This project is already implemented based on the documentation in the `doc-snapshot/` folder.

`doc-snapshot/pages/` holds one Markdown file per live doc page — instructions, explanations, code snippets, highlighted snippets, and examples. The working project contains their corresponding implementations. `doc-snapshot/manifest.json` records when the snapshot was last synced, and `doc-snapshot/CHANGELOG.md` records what changed upstream between syncs.

The project is intentionally **simple, lightweight, and testing-friendly**, allowing the implementation to be manually inspected and demonstrated. `autorecorder/` records that demonstration as video, one clip per doc page.

### Documentation Rules

* Treat the documentation as the source of truth for the intended implementation.
* **Strictly follow the documented code snippets and instructions.**
* Do not make changes simply to improve, refactor, or reinterpret the documented implementation.
* If something is wrong because of the **documentation itself** (for example, an incorrect instruction or incorrect code snippet), **do not fix the documentation-related issue in the project**. Report/identify it instead.
* If the problem is genuinely caused by the project implementation not matching correct documentation, it can be treated as a project-related issue.
* Do not silently change documented behavior.

### Relationship

* `doc-snapshot/pages/` = documented behavior and implementation (a synced copy of the live CopilotKit docs)
* Project code = working implementation
* Highlighted/code snippets = references to relevant implementation areas

The overall purpose is to provide a simple working representation of the documented functionality for manual QA and demonstration.

When comments or annotations are requested, keep them **short, specific, and directly tied to the relevant documentation or code snippet**.
