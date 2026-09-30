import { encodeChannelModel, modelOptionsFromChannels, useConfigStore, type ModelCapability, type ModelChannel } from '@/stores/use-config-store';

// Fixed by the parent at iframe creation, never inherited from legacy storage.
export const managedCanvasScope = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('managed') || '';
export const isManagedCanvas = Boolean(managedCanvasScope);
export function assertLocalCanvasGeneration() {
    if (isManagedCanvas) throw new Error('企业画布请使用14业务流程面板提交；模型与计费由服务器管理。');
}

export function applyManagedModelConfig(rawProviders: unknown, rawDefaults?: unknown) {
    if (!Array.isArray(rawProviders)) return;
    const providers = rawProviders.filter((item): item is { capability: ModelCapability; model: string; apiFormat: "openai" } => {
        if (!item || typeof item !== "object") return false;
        const provider = item as Record<string, unknown>;
        return ["image", "video", "text", "audio"].includes(String(provider.capability))
            && typeof provider.model === "string" && Boolean(provider.model.trim())
            && provider.apiFormat === "openai";
    });
    if (!providers.length) return;

    const channel: ModelChannel = {
        id: "erp-managed",
        name: "ERP 统一渠道",
        baseUrl: "ERP 统一配置",
        apiKey: "server-managed",
        apiFormat: "openai",
        models: providers.map((provider) => ({ name: provider.model, capability: provider.capability })),
        managed: true,
    };
    const defaults = rawDefaults && typeof rawDefaults === "object" ? rawDefaults as Partial<Record<ModelCapability, unknown>> : {};
    const value = (capability: ModelCapability) => {
        const requested = typeof defaults[capability] === "string" ? defaults[capability] : "";
        const provider = providers.find((item) => item.capability === capability && (!requested || item.model === requested))
            || providers.find((item) => item.capability === capability);
        return provider ? encodeChannelModel(channel.id, provider.model) : "";
    };
    const current = useConfigStore.getState().config;
    const imageModel = value("image");
    useConfigStore.setState({ config: {
        ...current,
        channels: [channel],
        models: modelOptionsFromChannels([channel]),
        baseUrl: channel.baseUrl,
        apiKey: channel.apiKey,
        apiFormat: channel.apiFormat,
        model: imageModel || value("text"),
        imageModel,
        videoModel: value("video"),
        textModel: value("text"),
        audioModel: value("audio"),
    } });
}
