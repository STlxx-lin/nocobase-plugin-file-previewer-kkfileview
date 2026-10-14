import { describe, expect, it } from 'vitest';

describe('BaseMetas Proxy Stream & URL Parsing Unit Tests', () => {
  it('正确解析 NocoBase 2.2 多级持久文件路径', () => {
    const parseUrl = (fileUrl: string) => {
      const filesMatch = fileUrl.match(/\/files\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/?#]+)/i);
      if (filesMatch) {
        const collectionName = decodeURIComponent(filesMatch[3]);
        const rawIdWithExt = decodeURIComponent(filesMatch[4]);
        const id = rawIdWithExt.replace(/\.[a-zA-Z0-9]+$/, '');
        return { collectionName, id };
      }
      const matched = fileUrl.match(/\/attachments\/([^\/?#]+)/i);
      if (matched && matched[1]) {
        const id = decodeURIComponent(matched[1]).replace(/\.[a-zA-Z0-9]+$/, '');
        return { collectionName: 'attachments', id };
      }
      return null;
    };

    // 标准附件路径
    expect(parseUrl('/files/main/main/attachments/12.docx')).toEqual({
      collectionName: 'attachments',
      id: '12',
    });

    // 带有 /api 前缀与完整域名
    expect(parseUrl('http://192.168.0.107:13000/api/files/main/main/attachments/35.pdf')).toEqual({
      collectionName: 'attachments',
      id: '35',
    });

    // 自定义数据表与 UUID 主键
    expect(parseUrl('/api/files/main/main/contracts/abc-1234-5678-uuid.xlsx')).toEqual({
      collectionName: 'contracts',
      id: 'abc-1234-5678-uuid',
    });

    // 历史 /attachments/ 格式兼容
    expect(parseUrl('/attachments/99.png')).toEqual({
      collectionName: 'attachments',
      id: '99',
    });
  });

  it('S3 对象存储 key 规范化拼接', () => {
    const resolveS3Key = (recPath: string, filename: string) => {
      const cleanPath = String(recPath || '').replace(/^\/+|\/+$/g, '');
      return cleanPath ? `${cleanPath}/${filename}` : filename;
    };

    expect(resolveS3Key('', 'sample.docx')).toBe('sample.docx');
    expect(resolveS3Key('uploads/2026/10', 'contract.pdf')).toBe('uploads/2026/10/contract.pdf');
    expect(resolveS3Key('/subfolder/', 'image.png')).toBe('subfolder/image.png');
  });

  it('URL 冒号 %3A 还原与参数规范化', () => {
    const normalizePathAndToken = (rawUrl: string, rawQuery: Record<string, string>) => {
      const url = rawUrl.replace(/%3A/gi, ':');
      const query = { ...rawQuery };
      if (query.token && !query.previewToken) {
        query.previewToken = query.token;
        delete query.token;
      }
      return { url, query };
    };

    const res = normalizePathAndToken('/api/kkfileviewFileViewerProxy%3Aget', {
      token: 'jwt_mock_token_123',
    });

    expect(res.url).toBe('/api/kkfileviewFileViewerProxy:get');
    expect(res.query.previewToken).toBe('jwt_mock_token_123');
    expect(res.query.token).toBeUndefined();
  });

  it('Token 目标地址鲁棒性比对（支持相对路径、绝对路径及编码差异）', () => {
    const isUrlMatch = (u1: string, u2: string) => {
      if (u1 === u2) return true;
      try {
        if (decodeURIComponent(u1) === decodeURIComponent(u2)) return true;
      } catch {}
      try {
        const p1 = new URL(u1, 'http://localhost');
        const p2 = new URL(u2, 'http://localhost');
        if (p1.pathname === p2.pathname) return true;
        if (decodeURIComponent(p1.pathname) === decodeURIComponent(p2.pathname)) return true;
      } catch {}
      return false;
    };

    // 绝对 vs 相对
    expect(
      isUrlMatch(
        '/api/files/main/main/attachments/1.docx',
        'http://192.168.0.107:13000/api/files/main/main/attachments/1.docx',
      ),
    ).toBe(true);

    // URL 编码 vs 解码
    expect(
      isUrlMatch(
        '/api/files/main/main/attachments/%E6%B5%8B%E8%AF%95.docx',
        '/api/files/main/main/attachments/测试.docx',
      ),
    ).toBe(true);

    // 完全不匹配的情况
    expect(
      isUrlMatch(
        '/api/files/main/main/attachments/1.docx',
        '/api/files/main/main/attachments/2.docx',
      ),
    ).toBe(false);
  });

  it('前置中间件精确识别 kkfileviewFileViewerProxy 并短路接管', async () => {
    let handledByProxy = false;
    let nextCalled = false;

    const mockPlugin = {
      handleFileViewerProxyAction: async (ctx: any) => {
        handledByProxy = true;
        ctx.status = 200;
        ctx.body = 'file-stream-ok';
      },
    };

    const handleProxyTokenQuery = async (ctx: any, next: any) => {
      const rawPath = String(ctx.path || ctx.url || ctx.originalUrl || ctx.req?.url || '');
      if (rawPath.includes('kkfileviewFileViewerProxy')) {
        if (ctx.query && ctx.query.token && !ctx.query.previewToken) {
          ctx.query.previewToken = ctx.query.token;
          delete ctx.query.token;
        }
        await mockPlugin.handleFileViewerProxyAction(ctx);
        return;
      }
      await next();
    };

    // 测试带 %3A 的 Java 客户端请求
    const ctxJavaClient: any = {
      path: '/api/kkfileviewFileViewerProxy%3Aget',
      url: '/api/kkfileviewFileViewerProxy%3Aget?url=/files/main/main/attachments/7.xlsx&token=tok_123',
      query: { url: '/files/main/main/attachments/7.xlsx', token: 'tok_123' },
    };

    await handleProxyTokenQuery(ctxJavaClient, async () => {
      nextCalled = true;
    });

    expect(handledByProxy).toBe(true);
    expect(nextCalled).toBe(false);
    expect(ctxJavaClient.query.previewToken).toBe('tok_123');
    expect(ctxJavaClient.query.token).toBeUndefined();
    expect(ctxJavaClient.status).toBe(200);
    expect(ctxJavaClient.body).toBe('file-stream-ok');
  });
});

