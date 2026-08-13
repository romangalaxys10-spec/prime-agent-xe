/**
 * Prime Agent XE — OpenAdapter / Koda provider extension
 *
 * OpenAdapter (https://openadapter.in) is an OpenAI-compatible LLM gateway:
 * one API key unlocks 40+ models (DeepSeek, Qwen, Mistral, Kimi K2.5, MiniMax,
 * GLM-5, Koda, and more). Point any OpenAI-compatible client at
 * https://api.openadapter.in/v1 and it just works.
 *
 * Koda is OpenAdapter's flagship model. Its OpenAI-compatible credentials can be
 * fetched from the gateway setup endpoint once you have an OpenAdapter API key:
 *
 *     GET https://api.openadapter.in/api/setup/koda?key=YOUR_OPENADAPTER_API_KEY
 *
 * (returns the base_url + api_key + model to drop into a client). This extension
 * registers the whole gateway as a Prime Agent provider so you can `/model` any
 * of its models directly.
 *
 * Usage:
 *   export OPENADAPTER_API_KEY=oa_xxx
 *   pi -e ./packages/coding-agent/examples/extensions/custom-provider-openadapter
 *   # then /model  ->  openadapter/koda
 *
 * Requires the `openai-completions` built-in API, which Prime Agent already
 * ships. No extra dependencies.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerProvider("openadapter", {
		// OpenAI-compatible gateway base URL.
		baseUrl: "https://api.openadapter.in/v1",
		apiKey: "OPENADAPTER_API_KEY",
		api: "openai-completions",

		models: [
			{
				id: "koda",
				name: "Koda (OpenAdapter)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 200000,
				maxTokens: 32768,
			},
			{
				id: "deepseek-chat",
				name: "DeepSeek Chat (OpenAdapter)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 128000,
				maxTokens: 8192,
			},
			{
				id: "qwen-max",
				name: "Qwen Max (OpenAdapter)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 131072,
				maxTokens: 16384,
			},
			{
				id: "kimi-k2.5",
				name: "Kimi K2.5 (OpenAdapter)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 256000,
				maxTokens: 32768,
			},
			{
				id: "glm-5",
				name: "GLM-5 (OpenAdapter)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 128000,
				maxTokens: 16384,
			},
			{
				id: "minimax-abab",
				name: "MiniMax ABAB (OpenAdapter)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 200000,
				maxTokens: 16384,
			},
		],
	});
}
