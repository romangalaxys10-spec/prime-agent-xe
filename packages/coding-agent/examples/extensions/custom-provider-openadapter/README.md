# OpenAdapter / Koda provider for Prime Agent XE

Turn [OpenAdapter](https://openadapter.in) — an OpenAI-compatible gateway to 40+
models (DeepSeek, Qwen, Mistral, **Kimi K2.5**, MiniMax, **GLM-5**, **Koda**, …) —
into a first-class Prime Agent provider. One `OPENADAPTER_API_KEY` gives access to
everything; pick any model with `/model`.

## Install

```bash
# from the Prime Agent XE repo root
export OPENADAPTER_API_KEY=oa_xxx        # from https://openadapter.in
prime-agent -e ./packages/coding-agent/examples/extensions/custom-provider-openadapter
# then inside the agent:  /model  ->  openadapter/koda
```

Or copy it into the auto-discovered extensions dir:

```bash
cp -r custom-provider-openadapter ~/.prime/agent/extensions/
```

## Koda one-liner setup

If you only want Koda, fetch its ready-made OpenAI-compatible credentials with
your OpenAdapter key (no extra config needed):

```bash
curl "https://api.openadapter.in/api/setup/koda?key=$OPENADAPTER_API_KEY"
```

The response gives a `base_url`, `api_key`, and `model` you can paste into any
OpenAI-compatible client — including a custom `openai-completions` provider in
Prime Agent.

## Why this matters for XE

OpenAdapter is the cheapest path to a multi-model fleet. Combined with Prime
Agent XE's recursive subagents and the `grill-me-codex`-style cross-model
adversarial review workflow (see `PRIME-AGENT-XE.md`), it lets a parent agent on
Koda delegate adversarial review to a different provider — so no model grades its
own work.
