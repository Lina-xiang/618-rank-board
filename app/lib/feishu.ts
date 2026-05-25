// 飞书 API 服务端调用 - 密钥在环境变量中，不暴露到前端

const FEISHU_API = "https://open.feishu.cn/open-apis";

function getConfig() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const appToken = process.env.FEISHU_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;

  if (!appId || !appSecret || !appToken || !tableId) {
    throw new Error("飞书配置不完整，请检查环境变量: FEISHU_APP_ID, FEISHU_APP_SECRET, FEISHU_APP_TOKEN, FEISHU_TABLE_ID");
  }
  return { appId, appSecret, appToken, tableId };
}

// 获取 tenant_access_token
async function getTenantToken(config: ReturnType<typeof getConfig>): Promise<string> {
  const res = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret }),
  });
  const data = await res.json();
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`飞书认证失败: ${data.msg || JSON.stringify(data)}`);
  }
  return data.tenant_access_token;
}

// 提取字段值
function extractValue(fields: Record<string, any>, fieldName: string): string | null {
  const val = fields[fieldName];
  if (val === undefined || val === null) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    if (typeof val[0] === "string") return val[0];
    if (val[0]?.text) return val[0].text;
    return String(val[0]);
  }
  if (typeof val === "object") {
    if (val.text) return val.text;
    if (val.value !== undefined) return String(val.value);
  }
  return String(val);
}

function extractNumber(fields: Record<string, any>, fieldName: string): number {
  const val = extractValue(fields, fieldName);
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

// 读取多维表格所有记录（自动分页）
async function getAllRecords(config: ReturnType<typeof getConfig>, token: string): Promise<any[]> {
  const all: any[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams();
    params.append("page_size", "500");
    if (pageToken) params.append("page_token", pageToken);

    const res = await fetch(
      `${FEISHU_API}/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?${params}`,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    const data = await res.json();
    if (data.code !== 0) {
      throw new Error(`读取表格失败: ${data.msg}`);
    }
    const items = data.data?.items || [];
    all.push(...items);
    pageToken = data.data?.page_token;
  } while (pageToken);

  return all;
}

// 主入口：读取飞书表格并解析为排名数据
export async function fetchRankData() {
  const config = getConfig();
  const token = await getTenantToken(config);
  const records = await getAllRecords(config, token);

  // 从环境变量读取字段名（默认：品牌、GMV、时间）
  const brandField = process.env.FIELD_BRAND || "品牌";
  const gmvField = process.env.FIELD_GMV || "GMV";
  const timeField = process.env.FIELD_TIME || "时间";

  const items = records
    .map((record: any) => {
      const fields = record.fields || {};
      const name = extractValue(fields, brandField) || "";
      const gmv = extractNumber(fields, gmvField);
      const timeVal = extractValue(fields, timeField);
      const updatedAt = timeVal
        ? new Date(timeVal).toISOString()
        : new Date().toISOString();
      return { name, gmv, updatedAt };
    })
    .filter((item) => item.name && item.gmv > 0);

  // 按 GMV 从高到低排序
  items.sort((a, b) => b.gmv - a.gmv);

  // 计算排名
  const ranked = items.map((item, idx) => ({
    rank: idx + 1,
    ...item,
    trend: "same" as "up" | "down" | "same",
  }));

  const totalGmv = items.reduce((sum, i) => sum + i.gmv, 0);

  return {
    items: ranked,
    totalGmv,
    totalBrands: ranked.length,
    updatedAt: new Date().toISOString(),
  };
}
