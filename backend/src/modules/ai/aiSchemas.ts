export const SUMMARY_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    contractType: { type: 'string', description: 'Loại hợp đồng (Mua bán, Dịch vụ, Thuê...)' },
    parties: {
      type: 'object',
      properties: {
        partyA: { type: 'string', description: 'Tên Bên A' },
        partyB: { type: 'string', description: 'Tên Bên B' },
      },
      required: ['partyA', 'partyB'],
    },
    keyObligations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Danh sách các nghĩa vụ chính của các bên',
    },
    financialTerms: {
      type: 'string',
      description:
        'Giá trị hợp đồng, phương thức và tiến độ thanh toán. Trình bày ngắt dòng rõ ràng (dùng ký tự xuống dòng \\n và gạch đầu dòng): Dòng 1 ghi rõ Tổng giá trị/ngân sách và cơ cấu thuế VAT/phí quản lý; Dòng 2 ghi phương thức thanh toán; Các dòng tiếp theo gạch đầu dòng chi tiết từng đợt thanh toán (Đợt 1, Đợt 2...) kèm tỷ lệ %, số tiền và điều kiện giải ngân. Tuyệt đối không viết dồn thành một khối văn bản liên tục.',
    },
    duration: { type: 'string', description: 'Thời hạn hiệu lực của hợp đồng' },
    terminationConditions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Điều kiện đơn phương hoặc thỏa thuận chấm dứt hợp đồng',
    },
    specialClauses: {
      type: 'array',
      items: { type: 'string' },
      description: 'Các điều khoản đặc biệt cần lưu ý (Bảo mật, Phạt vi phạm, Bồi thường...)',
    },
  },
  required: [
    'contractType',
    'parties',
    'keyObligations',
    'financialTerms',
    'duration',
    'terminationConditions',
    'specialClauses',
  ],
};

export const RISK_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    overallRiskLevel: {
      type: 'string',
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      description: 'Đánh giá mức độ rủi ro tổng thể',
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          clause: { type: 'string', description: 'Điều khoản liên quan trong hợp đồng' },
          documentRef: {
            type: 'string',
            description:
              'Vị trí tài liệu phát hiện rủi ro (VD: "HĐ Chính", "PL01", "PL02", hoặc "PL01 vs HĐ Chính" nếu có mâu thuẫn/xung đột giữa các tài liệu)',
          },
          riskLevel: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Mức độ rủi ro của điều khoản',
          },
          description: { type: 'string', description: 'Phân tích chi tiết rủi ro tiềm ẩn' },
          impact: { type: 'string', description: 'Thiệt hại tiềm tàng đối với công ty' },
          mitigationWording: { type: 'string', description: 'Câu chữ đề xuất sửa đổi để bảo vệ quyền lợi' },
        },
        required: ['clause', 'documentRef', 'riskLevel', 'description', 'impact', 'mitigationWording'],
      },
      description: 'Danh sách các điểm rủi ro được phát hiện',
    },
    favorableTerms: {
      type: 'array',
      items: { type: 'string' },
      description: 'Các điều khoản đang có lợi cho công ty',
    },
    summary: { type: 'string', description: 'Tóm lược nhận định pháp lý' },
  },
  required: ['overallRiskLevel', 'risks', 'favorableTerms', 'summary'],
};

export const DECISION_BRIEF_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    recommendation: {
      type: 'string',
      enum: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REJECT'],
      description: 'Khuyến nghị cho Trưởng phòng phê duyệt',
    },
    executiveSummary: { type: 'string', description: 'Bản tóm tắt súc tích cho cấp quản lý' },
    keyRisksRemaining: {
      type: 'array',
      items: { type: 'string' },
      description: 'Rủi ro còn tồn đọng sau các vòng đàm phán',
    },
    negotiationConcessions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalClause: { type: 'string', description: 'Điều khoản bản gốc' },
          revisedClause: { type: 'string', description: 'Điều khoản sau khi đàm phán sửa đổi' },
          concessionType: {
            type: 'string',
            enum: ['OUR_CONCESSION', 'THEIR_CONCESSION', 'MUTUAL'],
            description: 'Bên nào đã nhượng bộ',
          },
        },
        required: ['originalClause', 'revisedClause', 'concessionType'],
      },
      description: 'Tổng hợp các điểm nhượng bộ trong đàm phán',
    },
    unresolvedIssues: {
      type: 'array',
      items: { type: 'string' },
      description: 'Các điểm còn vướng mắc chưa thống nhất',
    },
    finalNotes: { type: 'string', description: 'Lưu ý cuối cùng trước khi ký số' },
  },
  required: [
    'recommendation',
    'executiveSummary',
    'keyRisksRemaining',
    'negotiationConcessions',
    'unresolvedIssues',
    'finalNotes',
  ],
};
