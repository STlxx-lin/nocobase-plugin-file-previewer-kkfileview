type RequireJsDefinedModules = Record<string, unknown>;

type RequireJsLike = {
  s?: {
    contexts?: Record<string, { defined?: RequireJsDefinedModules }>;
  };
};

type LegacyAppDevGlobal = typeof window & {
  __nocobase_app_dev_deps__?: Record<string, unknown>;
  __nocobase_app_dev_plugins__?: Record<string, unknown>;
  requirejs?: RequireJsLike;
};

// 仅回填 legacy `/admin` 入口当前会直接用到的开发态外部依赖，避免污染全局依赖表。
const LEGACY_APP_DEV_DEP_ALIASES: Array<[targetId: string, sourceId: string]> = [
  ['react', 'react'],
  ['react-dom', 'react-dom'],
  ['antd', 'antd'],
  ['@ant-design/icons', '@ant-design/icons'],
  ['@nocobase/client', '@nocobase/client'],
  ['@nocobase/client/client', '@nocobase/client'],
  ['@nocobase/plugin-file-manager/client', '@nocobase/plugin-file-manager/client'],
  ['file-saver', 'file-saver'],
];

function getDefinedModules(globalObject?: Partial<LegacyAppDevGlobal>) {
  const contexts =
    globalObject?.requirejs?.s?.contexts ||
    (globalObject?.requirejs as { requirejs?: RequireJsLike } | undefined)?.requirejs?.s?.contexts;
  if (!contexts) return {} as RequireJsDefinedModules;

  for (const context of Object.values(contexts)) {
    if (context?.defined) {
      return context.defined;
    }
  }

  return {} as RequireJsDefinedModules;
}

export function ensureLegacyAppDevDeps(globalObject?: Partial<LegacyAppDevGlobal>) {
  if (!globalObject) return {} as Record<string, unknown>;

  if (!globalObject.__nocobase_app_dev_deps__) {
    globalObject.__nocobase_app_dev_deps__ = {};
  }
  if (!globalObject.__nocobase_app_dev_plugins__) {
    globalObject.__nocobase_app_dev_plugins__ = {};
  }

  const definedModules = getDefinedModules(globalObject);
  // 全量桥接 RequireJS 已定义的模块，确保开发态热更新外部依赖（如 @formily/react、@formily/antd-v5 等）不为 undefined
  Object.keys(definedModules).forEach((modId) => {
    if (!globalObject.__nocobase_app_dev_deps__![modId]) {
      globalObject.__nocobase_app_dev_deps__![modId] = definedModules[modId];
    }
    if (!globalObject.__nocobase_app_dev_plugins__![modId]) {
      globalObject.__nocobase_app_dev_plugins__![modId] = definedModules[modId];
    }
  });

  LEGACY_APP_DEV_DEP_ALIASES.forEach(([targetId, sourceId]) => {
    if (definedModules[sourceId] !== undefined) {
      if (!globalObject.__nocobase_app_dev_deps__![targetId]) {
        globalObject.__nocobase_app_dev_deps__![targetId] = definedModules[sourceId];
      }
      if (!globalObject.__nocobase_app_dev_plugins__![targetId]) {
        globalObject.__nocobase_app_dev_plugins__![targetId] = definedModules[sourceId];
      }
    }
  });

  // 安全兜底 @nocobase/plugin-file-manager/client，防止解构 filePreviewTypes 抛出 TypeError
  const fmClientKey = '@nocobase/plugin-file-manager/client';
  if (!globalObject.__nocobase_app_dev_plugins__![fmClientKey]) {
    globalObject.__nocobase_app_dev_plugins__![fmClientKey] = {
      filePreviewTypes: {
        add: () => {},
        get: () => null,
      },
    };
  }
  const fmV2ClientKey = '@nocobase/plugin-file-manager/client-v2';
  if (!globalObject.__nocobase_app_dev_plugins__![fmV2ClientKey]) {
    globalObject.__nocobase_app_dev_plugins__![fmV2ClientKey] = {
      filePreviewTypes: {
        add: () => {},
        get: () => null,
      },
    };
  }

  return globalObject.__nocobase_app_dev_deps__;
}

// 旧版 `/admin` 页面不会像 modern client 那样预先注入 `__nocobase_app_dev_deps__`，这里在入口最早阶段补齐。
if (typeof window !== 'undefined') {
  ensureLegacyAppDevDeps(window as LegacyAppDevGlobal);
}
