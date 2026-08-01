(function () {
    'use strict';

    var LS_KEY = 'cvgen:draft:v1';
    var THEME_KEY = 'cvgen:theme:v1';
    var PAGE_W = 794;

    function $(s, c) { return (c || document).querySelector(s); }
    function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
    function uid() { return Math.random().toString(36).slice(2, 10); }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function blankState() {
        return {
            ui: { lang: 'vi' },
            personal: { fullName: '', jobTitle: '', email: '', phone: '', address: '', nationality: '', birthDate: '', linkedin: '', website: '' },
            objective: { summary: '' },
            experience: [],
            education: [],
            projects: [],
            skills: [],
            certifications: [],
            languages: [],
            awards: [],
            activities: [],
            references: [],
            additional: { text: '' },
            jd: ''
        };
    }

    var state = blankState();
    var undoStack = [];
    var saveTimer = null;
    var fitTimer = null;
    var renderTimer = null;

    var LEVELS = ['Cơ bản', 'Khá', 'Tốt', 'Thành thạo', 'Bản ngữ'];

    var T = {
        vi: {
            obj: 'Mục tiêu nghề nghiệp', exp: 'Kinh nghiệm làm việc', edu: 'Học vấn', proj: 'Dự án',
            skills: 'Kỹ năng', cert: 'Chứng chỉ', lang: 'Ngoại ngữ', award: 'Giải thưởng', act: 'Hoạt động',
            ref: 'Người tham chiếu', add: 'Thông tin bổ sung', present: 'Hiện tại', photo: 'Ảnh thẻ 3x4',
            attach: 'Attach Passport Photo', birth: 'Ngày sinh', nat: 'Quốc tịch',
            lvl: { 'Cơ bản': 'Cơ bản', 'Khá': 'Khá', 'Tốt': 'Tốt', 'Thành thạo': 'Thành thạo', 'Bản ngữ': 'Bản ngữ' }
        },
        en: {
            obj: 'Career Objective', exp: 'Work Experience', edu: 'Education', proj: 'Projects',
            skills: 'Skills', cert: 'Certifications', lang: 'Languages', award: 'Awards & Honors', act: 'Activities',
            ref: 'References', add: 'Additional Information', present: 'Present', photo: 'Passport photo 3x4',
            attach: 'Attach Passport Photo', birth: 'DOB', nat: 'Nationality',
            lvl: { 'Cơ bản': 'Basic', 'Khá': 'Good', 'Tốt': 'Proficient', 'Thành thạo': 'Fluent', 'Bản ngữ': 'Native' }
        }
    };

    var ACTION_VERBS = ('led managed developed designed implemented created improved increased reduced launched built delivered coordinated directed achieved mentored negotiated optimized streamlined trained analyzed researched resolved automated expanded produced handled maintained prepared processed operated organized planned presented promoted raised recommended supervised supported evaluated initiated established generated accelerated administered advised architected collaborated configured consulted cultivated drove executed facilitated founded guided hired identified invented marketed modernized monitored oversaw pioneered published reengineered revamped restructured saved secured selected shaped spearheaded transformed upgraded wrote authored administered audited budgeted catalyzed championed consolidated crafted cultivated cut decreased defined delegated delivered designed determined devised diagnosed doubled eliminated engineered enhanced enlarged erected established estimated evaluated executed expanded expedited fabricated facilitated financed forged formulated fortified generated grew guided headed helped implemented improved improvised incorporated increased influenced informed initiated innovated inspected inspired instituted insured integrated interpreted introduced invented investigated justified launched lectured leveraged localized maintained managed mapped marketed measured merged motivated navigated negotiated normalized nurtured observed obtained operated orchestrated ordered organized originated overhauled oversaw packaged participated penetrated perceived perfected performed persuaded pioneered planned positioned prepared presented prioritized processed procured produced programmed projected promoted proved provided publicized published purchased pursued qualified quantified quoted raised ranked reached received recognized recommended reconciled recruited reduced referenced refined regained regulated rehabilitated reinforced rejuvenated remodeled reorganized replaced reported represented resolved restored restructured retrieved revamped reversed reviewed revitalized revolutionized routed safeguarded salvaged satisfied saved screened secured separated served serviced settled shaped shared shipped simplified simulated slashed sold solicited solved sourced sparked spearheaded specialized specified spurred stabilized staffed staged standardized steered stimulated streamlined strengthened stressed structured studied submitted substantiated substituted succeeded suggested summarized superseded supervised supplied supported surpassed sustained tabulated tailored taught tended terminated tested tightened traced tracked trained transcribed transferred transformed translated transmitted transported traveled treated tripled trimmed triumphed troubleshot tutored unified united upgraded upheld utilized validated valued verified vitalized volunteered weighed welcomed widened wielded won worked wrote'.split(' '));

    var ACTION_VERBS_VN = ('lãnh đạo quản lý phát triển thiết kế xây dựng triển khai tạo lập tạo cải thiện nâng cao tăng giảm ra mắt khởi động dẫn dắt phối hợp đạt được đào tạo tối ưu tinh gọn phân tích nghiên cứu giải quyết tự động hóa mở rộng sản xuất tổ chức lên kế hoạch trình bày thuyết trình đề xuất giám sát hỗ trợ đánh giá thành lập khởi xướng đẩy mạnh phụ trách điều phối kiểm soát xử lý khắc phục hoàn thành xây dựng vận hành đảm bảo xây dựng thiết lập cải tiến tiết kiệm mang lại đem lại chủ trì tuyển dụng huấn luyện hướng dẫn kiểm tra giám định'.split(' '));

    var STOPWORDS = new Set(('the a an of in on for with at by to and or is are be been was were you your we our their they them will can should must have has had this that these those from as it its not no so but if than then too very each any all some such who what when where which why how into over under about between through during before after above below up down out off again further once here there what'.split(' ') +
        ' về cho với của và là có tại trong ngoài theo được sẽ đã đang không các một những người công việc làm khi thì này đó để vì nên như cũng từ đến qua trên dưới ra vào hơn cần phải đều chính còn lại nếu hay hoặc mà bạn tôi họ chúng anh chị em'.split(' ')));

    var VN_WEAK = {
        'làm việc tại': 'đảm nhận', 'làm việc ở': 'làm việc tại', 'làm việc với': 'phối hợp với',
        'giúp đỡ': 'hỗ trợ', 'giúp': 'hỗ trợ', 'chịu trách nhiệm về': 'quản lý', 'chịu trách nhiệm': 'phụ trách',
        'dùng': 'sử dụng', 'xử lý': 'giải quyết', 'tìm hiểu': 'nghiên cứu', 'nói chuyện với': 'trao đổi với',
        'theo dõi': 'giám sát', 'trông coi': 'quản lý', 'lo việc': 'phụ trách',
        'được giao nhiệm vụ': 'đảm nhận', 'được giao': 'đảm nhận', 'được phân công': 'đảm nhận',
        'có nhiệm vụ': 'phụ trách', 'chuyên phụ trách': 'phụ trách', 'phụ trách mảng': 'phụ trách',
        'viết bài': 'biên soạn nội dung', 'viết nội dung': 'biên soạn nội dung', 'đăng bài': 'xuất bản bài viết',
        'chạy quảng cáo': 'vận hành chiến dịch quảng cáo', 'đặt quảng cáo': 'triển khai quảng cáo',
        'chăm sóc khách': 'hỗ trợ khách hàng', 'chăm sóc khách hàng': 'hỗ trợ khách hàng',
        'nhập liệu': 'cập nhật dữ liệu', 'gọi điện': 'trao đổi qua điện thoại', 'in ấn': 'chuẩn bị tài liệu',
        'sửa lỗi': 'khắc phục lỗi', 'fix lỗi': 'khắc phục lỗi', 'test': 'kiểm thử',
        'làm báo cáo': 'lập báo cáo', 'làm hồ sơ': 'soạn thảo hồ sơ', 'làm slide': 'thiết kế bài thuyết trình',
        'học hỏi': 'nghiên cứu', 'điều tra': 'khảo sát', 'quét': 'rà soát', 'soạn thảo': 'biên soạn',
        'làm việc tại': 'công tác tại', 'làm việc ở': 'công tác tại'
    };

    var EN_WEAK = {
        'worked on': 'developed', 'worked with': 'collaborated with', 'worked as': 'served as',
        'helped with': 'assisted with', 'helped': 'supported', 'was responsible for': 'led',
        'was in charge of': 'led', 'responsible for': 'owned', 'in charge of': 'led',
        'took care of': 'managed', 'tried to': 'aimed to', 'dealt with': 'resolved',
        'was part of': 'contributed to', 'talked to': 'communicated with',
        'used to': 'leveraged', 'looked after': 'managed', 'handled': 'managed',
        'made': 'created', 'did': 'executed', 'built': 'developed', 'fixed': 'resolved',
        'wrote': 'authored', 'started': 'launched', 'grew': 'expanded', 'ran': 'operated',
        'got': 'secured', 'watched': 'monitored', 'kept': 'maintained', 'found': 'identified',
        'learned': 'mastered', 'learnt': 'mastered', 'checked': 'reviewed', 'sent': 'delivered',
        'recruited': 'hired', 'trained': 'coached', 'organised': 'orchestrated', 'organized': 'orchestrated',
        'managed the team': 'led the team', 'assisted': 'supported', 'assist': 'support'
    };

    var FILLERS_VN = ['vô cùng', 'thực sự rất', 'thực sự', 'khá là', 'rất', 'có thể nói là', 'một cách', 'nhằm mục đích', 'để có thể'];
    var FILLERS_EN = ['very', 'really', 'quite', 'actually', 'basically', 'in order to', 'kind of', 'sort of'];

    var ROLE_SKILLS = {
        developer: ['JavaScript', 'HTML/CSS', 'SQL', 'Git', 'Node.js', 'React', 'REST API', 'Docker', 'CI/CD', 'Unit Testing'],
        designer: ['Photoshop', 'Illustrator', 'Figma', 'Canva', 'Typography', 'Design System', 'Wireframing', 'Prototyping'],
        marketing: ['SEO', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Email Marketing', 'Google Analytics', 'Copywriting'],
        sales: ['Negotiation', 'CRM', 'B2B Sales', 'Sales Funnel', 'Customer Relationship'],
        teacher: ['Lesson Planning', 'Classroom Management', 'Curriculum Design', 'Assessment'],
        data: ['Python', 'SQL', 'Excel', 'Power BI', 'Statistics', 'Data Cleaning', 'Visualization'],
        finance: ['Excel', 'Financial Analysis', 'Budgeting', 'Forecasting', 'Accounting'],
        admin: ['Office', 'Scheduling', 'Document Management', 'Data Entry', 'Communication'],
        logistics: ['Inventory Management', 'SAP', 'Supply Chain', 'Scheduling', 'Quality Control']
    };

    var ROLE_PATTERNS = [
        [/dev|lập trình|software|kỹ sư phần mềm|it\b|hệ thống/i, 'developer'],
        [/design|thiết kế|đồ họa|ux|ui/i, 'designer'],
        [/market|marketing|content|nội dung|quảng cáo|ads/i, 'marketing'],
        [/sales|bán hàng|kinh doanh/i, 'sales'],
        [/teacher|giáo viên|giảng dạy|dạy học/i, 'teacher'],
        [/data|dữ liệu|analyst|phân tích/i, 'data'],
        [/finance|tài chính|kế toán|accounting/i, 'finance'],
        [/admin|hành chính|văn phòng|secretary/i, 'admin'],
        [/logistic|logistics|hậu cần|kho vận/i, 'logistics']
    ];

    var KNOWN_TECH = ['python', 'javascript', 'java', 'c++', 'c#', 'php', 'sql', 'mysql', 'postgresql', 'mongodb', 'react', 'node.js', 'nodejs', 'typescript', 'go', 'rust', 'html', 'css', 'excel', 'powerpoint', 'word', 'photoshop', 'illustrator', 'canva', 'figma', 'premiere', 'after effects', 'seo', 'google analytics', 'google ads', 'facebook ads', 'tiktok', 'wordpress', 'hugo', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'power bi', 'tableau', 'sap', 'autocad', 'solidworks', 'rhino', 'sketchup', 'blender', 'unity', 'flutter', 'react native', 'android', 'ios', 'machine learning', 'ai', 'chatgpt', 'postman', 'jira', 'figma', 'notion', 'trello', 'asana', 'zoho', 'photoshop', 'lightroom', 'davinci', 'edius', 'salesforce', 'hubspot', 'mailchimp', 'shopify', 'woocommerce', 'github', 'linux', 'windows', 'macos', 'networking', 'tcp/ip', 'firebase', 'vercel', 'netlify'];

    function toast(msg, isError) {
        var old = $('#cvgen-toast');
        if (old) old.remove();
        var el = document.createElement('div');
        el.className = 'cvgen-toast' + (isError ? ' is-error' : '');
        el.id = 'cvgen-toast';
        el.setAttribute('role', 'status');
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 4200);
    }

    function nowTime() {
        var d = new Date();
        function p(n) { return (n < 10 ? '0' : '') + n; }
        return p(d.getHours()) + ':' + p(d.getMinutes());
    }

    function markSaved() {
        var el = $('#cvgen-save-state');
        if (el) el.textContent = 'Đã lưu tự động lúc ' + nowTime();
    }

    function saveDraft() {
        try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { }
        markSaved();
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDraft, 400);
    }

    function loadDraft() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var s = JSON.parse(raw);
                var b = blankState();
                Object.keys(b).forEach(function (k) {
                    if (s[k] !== undefined) b[k] = s[k];
                });
                if (!b.ui || typeof b.ui.lang !== 'string') b.ui = { lang: 'vi' };
                state = b;
            }
        } catch (e) { }
    }

    function pushUndo() {
        undoStack.push(JSON.parse(JSON.stringify(state)));
        if (undoStack.length > 10) undoStack.shift();
    }

    function snapshot() {
        return JSON.parse(JSON.stringify(state));
    }

    function entryTemplate(listKey, item, idx) {
        var i = item || {};
        switch (listKey) {
            case 'exp':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="exp" data-idx="' + idx + '" aria-label="Xóa mục kinh nghiệm">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="exp-' + idx + '-t">Chức danh</label><input id="exp-' + idx + '-t" data-field="title" value="' + esc(i.title) + '" placeholder="Nhân viên Marketing"></div>' +
                    '<div class="cvgen-field"><label for="exp-' + idx + '-c">Công ty</label><input id="exp-' + idx + '-c" data-field="company" value="' + esc(i.company) + '" placeholder="ABC Corp"></div>' +
                    '</div>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="exp-' + idx + '-l">Địa điểm</label><input id="exp-' + idx + '-l" data-field="location" value="' + esc(i.location) + '" placeholder="TP. Hồ Chí Minh"></div>' +
                    '<div class="cvgen-field"><label for="exp-' + idx + '-s">Từ tháng</label><input id="exp-' + idx + '-s" type="month" data-field="start" value="' + esc(i.start) + '"></div>' +
                    '</div>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="exp-' + idx + '-e">Đến tháng</label><input id="exp-' + idx + '-e" type="month" data-field="end" value="' + esc(i.end) + '"></div>' +
                    '<div class="cvgen-field"><label class="cvgen-check"><input type="checkbox" data-field="current" ' + (i.current ? 'checked' : '') + '> Đang làm tại đây</label></div>' +
                    '</div>' +
                    '<div class="cvgen-bullets">' + bulletRows(listKey, idx, i.bullets) + '</div>' +
                    '<button type="button" class="cvgen-btn cvgen-bullet-add" data-act="bullet-add" data-list="exp" data-idx="' + idx + '">+ Thêm dòng mô tả</button>' +
                    '</div>';
            case 'edu':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="edu" data-idx="' + idx + '" aria-label="Xóa mục học vấn">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="edu-' + idx + '-s">Trường</label><input id="edu-' + idx + '-s" data-field="school" value="' + esc(i.school) + '" placeholder="Đại học Kinh tế"></div>' +
                    '<div class="cvgen-field"><label for="edu-' + idx + '-d">Bằng cấp</label><input id="edu-' + idx + '-d" data-field="degree" value="' + esc(i.degree) + '" placeholder="Cử nhân"></div>' +
                    '</div>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="edu-' + idx + '-f">Chuyên ngành</label><input id="edu-' + idx + '-f" data-field="field" value="' + esc(i.field) + '" placeholder="Marketing"></div>' +
                    '<div class="cvgen-field"><label for="edu-' + idx + '-g">GPA</label><input id="edu-' + idx + '-g" data-field="gpa" value="' + esc(i.gpa) + '" placeholder="3.2/4.0"></div>' +
                    '</div>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="edu-' + idx + '-s2">Từ năm</label><input id="edu-' + idx + '-s2" type="month" data-field="start" value="' + esc(i.start) + '"></div>' +
                    '<div class="cvgen-field"><label for="edu-' + idx + '-e2">Đến năm</label><input id="edu-' + idx + '-e2" type="month" data-field="end" value="' + esc(i.end) + '"></div>' +
                    '</div>' +
                    '</div>';
            case 'proj':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="proj" data-idx="' + idx + '" aria-label="Xóa mục dự án">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="proj-' + idx + '-n">Tên dự án</label><input id="proj-' + idx + '-n" data-field="name" value="' + esc(i.name) + '" placeholder="Website bán hàng"></div>' +
                    '<div class="cvgen-field"><label for="proj-' + idx + '-l">Link</label><input id="proj-' + idx + '-l" data-field="link" value="' + esc(i.link) + '" placeholder="https://..."></div>' +
                    '</div>' +
                    '<div class="cvgen-field"><label for="proj-' + idx + '-d">Mô tả</label><textarea id="proj-' + idx + '-d" data-field="description" rows="2" placeholder="Vai trò, kết quả đạt được...">' + esc(i.description) + '</textarea></div>' +
                    '</div>';
            case 'skills':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="skills" data-idx="' + idx + '" aria-label="Xóa mục kỹ năng">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="skill-' + idx + '-n">Tên kỹ năng</label><input id="skill-' + idx + '-n" data-field="name" value="' + esc(i.name) + '" placeholder="SEO"></div>' +
                    '<div class="cvgen-field"><label for="skill-' + idx + '-l">Trình độ</label><select id="skill-' + idx + '-l" data-field="level">' + levelOptions(i.level) + '</select></div>' +
                    '</div>' +
                    '</div>';
            case 'cert':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="cert" data-idx="' + idx + '" aria-label="Xóa mục chứng chỉ">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="cert-' + idx + '-n">Tên chứng chỉ</label><input id="cert-' + idx + '-n" data-field="name" value="' + esc(i.name) + '" placeholder="Google Analytics Certificate"></div>' +
                    '<div class="cvgen-field"><label for="cert-' + idx + '-i">Tổ chức cấp</label><input id="cert-' + idx + '-i" data-field="issuer" value="' + esc(i.issuer) + '" placeholder="Google"></div>' +
                    '</div>' +
                    '<div class="cvgen-field"><label for="cert-' + idx + '-y">Năm</label><input id="cert-' + idx + '-y" data-field="year" value="' + esc(i.year) + '" placeholder="2025"></div>' +
                    '</div>';
            case 'lang':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="lang" data-idx="' + idx + '" aria-label="Xóa mục ngoại ngữ">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="lang-' + idx + '-n">Ngôn ngữ</label><input id="lang-' + idx + '-n" data-field="name" value="' + esc(i.name) + '" placeholder="Tiếng Anh"></div>' +
                    '<div class="cvgen-field"><label for="lang-' + idx + '-l">Trình độ</label><select id="lang-' + idx + '-l" data-field="level">' + levelOptions(i.level) + '</select></div>' +
                    '</div>' +
                    '</div>';
            case 'award':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="award" data-idx="' + idx + '" aria-label="Xóa mục giải thưởng">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="award-' + idx + '-n">Tên giải thưởng</label><input id="award-' + idx + '-n" data-field="name" value="' + esc(i.name) + '" placeholder="Nhân viên xuất sắc"></div>' +
                    '<div class="cvgen-field"><label for="award-' + idx + '-o">Tổ chức</label><input id="award-' + idx + '-o" data-field="org" value="' + esc(i.org) + '" placeholder="Công ty ABC"></div>' +
                    '</div>' +
                    '<div class="cvgen-field"><label for="award-' + idx + '-y">Năm</label><input id="award-' + idx + '-y" data-field="year" value="' + esc(i.year) + '" placeholder="2025"></div>' +
                    '</div>';
            case 'act':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="act" data-idx="' + idx + '" aria-label="Xóa mục hoạt động">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="act-' + idx + '-t">Hoạt động</label><input id="act-' + idx + '-t" data-field="title" value="' + esc(i.title) + '" placeholder="Tình nguyện viên"></div>' +
                    '<div class="cvgen-field"><label for="act-' + idx + '-o">Tổ chức</label><input id="act-' + idx + '-o" data-field="org" value="' + esc(i.org) + '" placeholder="CLB X"></div>' +
                    '</div>' +
                    '<div class="cvgen-field"><label for="act-' + idx + '-d">Mô tả</label><textarea id="act-' + idx + '-d" data-field="description" rows="2">' + esc(i.description) + '</textarea></div>' +
                    '</div>';
            case 'ref':
                return '<div class="cvgen-entry">' +
                    '<button type="button" class="cvgen-entry-remove" data-act="remove" data-list="ref" data-idx="' + idx + '" aria-label="Xóa mục người tham chiếu">✕</button>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="ref-' + idx + '-n">Họ tên</label><input id="ref-' + idx + '-n" data-field="name" value="' + esc(i.name) + '" placeholder="Trần Thị B"></div>' +
                    '<div class="cvgen-field"><label for="ref-' + idx + '-t">Chức danh</label><input id="ref-' + idx + '-t" data-field="title" value="' + esc(i.title) + '" placeholder="Giám đốc Marketing"></div>' +
                    '</div>' +
                    '<div class="cvgen-entry-row">' +
                    '<div class="cvgen-field"><label for="ref-' + idx + '-c">Công ty</label><input id="ref-' + idx + '-c" data-field="company" value="' + esc(i.company) + '"></div>' +
                    '<div class="cvgen-field"><label for="ref-' + idx + '-e">Email</label><input id="ref-' + idx + '-e" type="email" data-field="email" value="' + esc(i.email) + '"></div>' +
                    '</div>' +
                    '<div class="cvgen-field"><label for="ref-' + idx + '-p">Điện thoại</label><input id="ref-' + idx + '-p" data-field="phone" value="' + esc(i.phone) + '"></div>' +
                    '</div>';
        }
        return '';
    }

    function bulletRows(listKey, idx, bullets) {
        var arr = bullets && bullets.length ? bullets : [''];
        return arr.map(function (b, bi) {
            return '<div class="cvgen-bullet-row">' +
                '<textarea data-field="bullet" placeholder="Mô tả công việc / thành tích cụ thể...">' + esc(b) + '</textarea>' +
                '<button type="button" class="cvgen-bullet-remove" data-act="bullet-remove" data-list="' + listKey + '" data-idx="' + idx + '" data-bidx="' + bi + '" aria-label="Xóa dòng mô tả">✕</button>' +
                '</div>';
        }).join('');
    }

    function levelOptions(current) {
        return '<option value="">Chọn trình độ</option>' + LEVELS.map(function (l) {
            return '<option value="' + l + '"' + (l === current ? ' selected' : '') + '>' + l + '</option>';
        }).join('');
    }

    function renderLists() {
        var map = {
            exp: state.experience, edu: state.education, proj: state.projects, skills: state.skills,
            cert: state.certifications, lang: state.languages, award: state.awards, act: state.activities, ref: state.references
        };
        Object.keys(map).forEach(function (k) {
            var box = $('#' + k + '-list');
            var items = map[k];
            box.innerHTML = (items.length ? '' : '<p class="cvgen-empty">Chưa có mục nào</p>') +
                items.map(function (it, idx) { return entryTemplate(k, it, idx); }).join('');
        });
    }

    function cvgenEmptyStyle() {
        var st = document.createElement('style');
        st.textContent = '.cvgen-empty{font-size:.8rem;color:var(--cvgen-muted);margin:4px 0 0;}';
        document.head.appendChild(st);
    }

    function setStaticValues() {
        var binds = ['personal.fullName', 'personal.jobTitle', 'personal.email', 'personal.phone', 'personal.address', 'personal.nationality', 'personal.birthDate', 'personal.linkedin', 'personal.website', 'ui.lang', 'objective.summary', 'additional.text', 'jd'];
        binds.forEach(function (p) {
            var el = $('[data-bind="' + p + '"]');
            if (el) {
                var v = p.split('.').reduce(function (o, k) { return o ? o[k] : undefined; }, state);
                if (el.type === 'checkbox') el.checked = !!v;
                else el.value = v == null ? '' : v;
            }
        });
    }

    function applyStateToForm() {
        setStaticValues();
        renderLists();
    }

    function collectState() {
        $$('#cvgen-form [data-bind]').forEach(function (el) {
            var p = el.getAttribute('data-bind').split('.');
            var obj = state;
            for (var i = 0; i < p.length - 1; i++) obj = obj[p[i]];
            obj[p[p.length - 1]] = el.type === 'checkbox' ? el.checked : el.value;
        });
        var readList = function (key, fields) {
            return $$('#' + key + '-list .cvgen-entry').map(function (row, idx) {
                var item = {};
                fields.forEach(function (f) {
                    var el = row.querySelector('[data-field="' + f + '"]');
                    if (f === 'current') item[f] = el ? el.checked : false;
                    else item[f] = el ? el.value : '';
                });
                if (key === 'exp') {
                    item.bullets = $$('textarea[data-field="bullet"]', row).map(function (b) { return b.value; });
                }
                return item;
            });
        };
        state.experience = readList('exp', ['title', 'company', 'location', 'start', 'end', 'current']);
        state.education = readList('edu', ['school', 'degree', 'field', 'gpa', 'start', 'end']);
        state.projects = readList('proj', ['name', 'link', 'description']);
        state.skills = readList('skills', ['name', 'level']);
        state.certifications = readList('cert', ['name', 'issuer', 'year']);
        state.languages = readList('lang', ['name', 'level']);
        state.awards = readList('award', ['name', 'org', 'year']);
        state.activities = readList('act', ['title', 'org', 'description']);
        state.references = readList('ref', ['name', 'title', 'company', 'email', 'phone']);
    }

    function fmtMonth(v, lang) {
        if (!v) return '';
        var parts = v.split('-');
        if (parts.length < 2) return v;
        if (lang === 'en') {
            var d = new Date(+parts[0], +parts[1] - 1, 1);
            return d.toLocaleString('en-US', { month: 'short' }) + ' ' + parts[0];
        }
        return parts[1] + '/' + parts[0];
    }

    function fmtDateFull(v, lang) {
        if (!v) return '';
        var d = new Date(v + 'T00:00:00');
        if (isNaN(d)) return v;
        if (lang === 'en') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function periodLabel(s, e, cur, lang) {
        if (cur) return fmtMonth(s, lang) + (s ? ' – ' : '') + T[lang].present;
        return [fmtMonth(s, lang), fmtMonth(e, lang)].filter(Boolean).join(' – ');
    }

    function stripScheme(v) {
        return String(v || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    }

    function renderPreview() {
        var s = state;
        var lang = (s.ui && s.ui.lang === 'en') ? 'en' : 'vi';
        var L = T[lang];
        var p = s.personal;
        var html = '';

        html += '<div class="cvp-head">' +
            '<div class="cvp-head-main">' +
            '<h1 class="cvp-name">' + esc(p.fullName || 'Họ và tên') + '</h1>' +
            (p.jobTitle ? '<p class="cvp-jobtitle">' + esc(p.jobTitle) + '</p>' : '') +
            '<ul class="cvp-contact">' +
            (p.email ? '<li>' + esc(p.email) + '</li>' : '') +
            (p.phone ? '<li>' + esc(p.phone) + '</li>' : '') +
            (p.address ? '<li>' + esc(p.address) + '</li>' : '') +
            (p.linkedin ? '<li>' + esc(stripScheme(p.linkedin)) + '</li>' : '') +
            (p.website ? '<li>' + esc(stripScheme(p.website)) + '</li>' : '') +
            ((p.birthDate || p.nationality) ? '<li>' + [(p.birthDate ? L.birth + ': ' + fmtDateFull(p.birthDate, lang) : ''), (p.nationality ? L.nat + ': ' + p.nationality : '')].filter(Boolean).join(' · ') + '</li>' : '') +
            '</ul>' +
            '</div>' +
            '<div class="cvp-photo">' +
            '<div class="cvp-photo-box" aria-label="' + esc(L.attach) + '"><strong>' + esc(L.attach) + '</strong><span>3x4</span></div>' +
            '<p class="cvp-photo-note">' + esc(L.photo) + '</p>' +
            '</div>' +
            '</div>';

        if (s.objective.summary.trim()) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.obj) + '</h2><p class="cvp-objective">' + esc(s.objective.summary) + '</p></section>';
        }

        var exps = s.experience.filter(function (e) { return e.title.trim() || e.company.trim(); });
        if (exps.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.exp) + '</h2>';
            exps.forEach(function (e) {
                html += '<div class="cvp-entry">' +
                    '<div class="cvp-entry-head"><div><p class="cvp-entry-title">' + esc(e.title) + (e.company ? '<span class="cvp-entry-org"> — ' + esc(e.company) + '</span>' : '') + '</p>' +
                    (e.location ? '<p class="cvp-entry-loc">' + esc(e.location) + '</p>' : '') + '</div>' +
                    '<span class="cvp-entry-date">' + esc(periodLabel(e.start, e.end, e.current, lang)) + '</span></div>';
                var bl = (e.bullets || []).filter(function (b) { return b.trim(); });
                if (bl.length) {
                    html += '<ul class="cvp-bullets">' + bl.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>';
                }
                html += '</div>';
            });
            html += '</section>';
        }

        var edus = s.education.filter(function (e) { return e.school.trim() || e.degree.trim(); });
        if (edus.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.edu) + '</h2>';
            edus.forEach(function (e) {
                var deg = [e.degree, e.field].filter(Boolean).join(', ');
                html += '<div class="cvp-entry">' +
                    '<div class="cvp-entry-head"><div><p class="cvp-entry-title">' + esc(deg || e.school) + '</p>' +
                    (e.school ? '<p class="cvp-entry-org">' + esc(e.school) + '</p>' : '') +
                    (e.gpa ? '<p class="cvp-entry-loc">GPA: ' + esc(e.gpa) + '</p>' : '') + '</div>' +
                    '<span class="cvp-entry-date">' + esc(periodLabel(e.start, e.end, false, lang)) + '</span></div>' +
                    '</div>';
            });
            html += '</section>';
        }

        var projs = s.projects.filter(function (x) { return x.name.trim(); });
        if (projs.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.proj) + '</h2>';
            projs.forEach(function (x) {
                html += '<div class="cvp-entry"><div class="cvp-entry-head"><p class="cvp-entry-title">' + esc(x.name) + '</p>' +
                    (x.link ? '<span class="cvp-entry-date">' + esc(stripScheme(x.link)) + '</span>' : '') + '</div>' +
                    (x.description.trim() ? '<p class="cvp-line">' + esc(x.description) + '</p>' : '') + '</div>';
            });
            html += '</section>';
        }

        var skills = s.skills.filter(function (x) { return x.name.trim(); });
        if (skills.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.skills) + '</h2><p class="cvp-skills">' +
                skills.map(function (x) { return esc(x.name) + (x.level ? ' (' + esc((L.lvl[x.level] || x.level)) + ')' : ''); }).join(', ') +
                '</p></section>';
        }

        var certs = s.certifications.filter(function (x) { return x.name.trim(); });
        if (certs.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.cert) + '</h2>';
            certs.forEach(function (x) {
                html += '<p class="cvp-line">• ' + esc(x.name) + (x.issuer ? ' — ' + esc(x.issuer) : '') + (x.year ? ' (' + esc(x.year) + ')' : '') + '</p>';
            });
            html += '</section>';
        }

        var langs = s.languages.filter(function (x) { return x.name.trim(); });
        if (langs.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.lang) + '</h2>';
            langs.forEach(function (x) {
                html += '<p class="cvp-line">' + esc(x.name) + (x.level ? ' — ' + esc(L.lvl[x.level] || x.level) : '') + '</p>';
            });
            html += '</section>';
        }

        var awards = s.awards.filter(function (x) { return x.name.trim(); });
        if (awards.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.award) + '</h2>';
            awards.forEach(function (x) {
                html += '<p class="cvp-line">• ' + esc(x.name) + (x.org ? ' — ' + esc(x.org) : '') + (x.year ? ' (' + esc(x.year) + ')' : '') + '</p>';
            });
            html += '</section>';
        }

        var acts = s.activities.filter(function (x) { return x.title.trim(); });
        if (acts.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.act) + '</h2>';
            acts.forEach(function (x) {
                html += '<div class="cvp-entry"><div class="cvp-entry-head"><p class="cvp-entry-title">' + esc(x.title) + '</p>' +
                    (x.org ? '<span class="cvp-entry-date">' + esc(x.org) + '</span>' : '') + '</div>' +
                    (x.description.trim() ? '<p class="cvp-line">' + esc(x.description) + '</p>' : '') + '</div>';
            });
            html += '</section>';
        }

        var refs = s.references.filter(function (x) { return x.name.trim(); });
        if (refs.length) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.ref) + '</h2><div class="cvp-2col">';
            refs.forEach(function (x) {
                html += '<div class="cvp-ref"><span class="cvp-ref-name">' + esc(x.name) + '</span>' +
                    ((x.title || x.company) ? '<br>' + esc([x.title, x.company].filter(Boolean).join(', ')) : '') +
                    ((x.email || x.phone) ? '<br>' + esc([x.email, x.phone].filter(Boolean).join(' • ')) : '') + '</div>';
            });
            html += '</div></section>';
        }

        if (s.additional.text.trim()) {
            html += '<section class="cvp-sec"><h2 class="cvp-sec-t">' + esc(L.add) + '</h2><p class="cvp-additional">' + esc(s.additional.text) + '</p></section>';
        }

        $('#cv-preview').innerHTML = html;
    }

    function requiredList() {
        var miss = [];
        if (!state.personal.fullName.trim()) miss.push({ id: 'sec-personal', label: 'Họ và tên', field: 'f-fullName' });
        if (!/^\S+@\S+\.\S+$/.test(state.personal.email.trim())) miss.push({ id: 'sec-personal', label: 'Email hợp lệ', field: 'f-email' });
        if (!/[0-9+()\-\s]{8,}/.test(state.personal.phone.trim())) miss.push({ id: 'sec-personal', label: 'Số điện thoại', field: 'f-phone' });
        if (!state.objective.summary.trim()) miss.push({ id: 'sec-objective', label: 'Mục tiêu nghề nghiệp', field: 'f-summary' });
        if (!state.experience.some(function (e) { return e.title.trim() && e.company.trim(); })) miss.push({ id: 'sec-experience', label: 'Ít nhất 1 kinh nghiệm (chức danh + công ty)', field: null });
        if (!state.education.some(function (e) { return e.school.trim(); })) miss.push({ id: 'sec-education', label: 'Ít nhất 1 mục học vấn', field: null });
        if (!state.skills.some(function (x) { return x.name.trim(); })) miss.push({ id: 'sec-skills', label: 'Ít nhất 1 kỹ năng', field: null });
        return miss;
    }

    function completionPct() {
        var s = state;
        var w = {
            fullName: 15, jobTitle: 4, email: 10, phone: 10, address: 2, linkedin: 3, website: 3, birthDate: 1, nationality: 1,
            summary: 15, exp: 20, edu: 12, skills: 8, proj: 3, cert: 2, lang: 2, award: 2, act: 2, ref: 2, additional: 1
        };
        var total = 0, got = 0;
        function add(k, fn) { total += w[k]; if (fn()) got += w[k]; }
        add('fullName', function () { return !!s.personal.fullName.trim(); });
        add('jobTitle', function () { return !!s.personal.jobTitle.trim(); });
        add('email', function () { return /^\S+@\S+\.\S+$/.test(s.personal.email.trim()); });
        add('phone', function () { return /[0-9+()\-\s]{8,}/.test(s.personal.phone.trim()); });
        add('address', function () { return !!s.personal.address.trim(); });
        add('linkedin', function () { return !!s.personal.linkedin.trim(); });
        add('website', function () { return !!s.personal.website.trim(); });
        add('birthDate', function () { return !!s.personal.birthDate; });
        add('nationality', function () { return !!s.personal.nationality.trim(); });
        add('summary', function () { return s.objective.summary.trim().length >= 60; });
        add('exp', function () { var e = s.experience.filter(function (x) { return x.title.trim() && x.company.trim(); }); return e.length >= 1 && e.some(function (x) { return (x.bullets || []).some(function (b) { return b.trim(); }); }); });
        add('edu', function () { return s.education.some(function (e) { return e.school.trim() && e.degree.trim(); }); });
        add('skills', function () { return s.skills.filter(function (x) { return x.name.trim(); }).length >= 4; });
        add('proj', function () { return s.projects.some(function (x) { return x.name.trim(); }); });
        add('cert', function () { return s.certifications.some(function (x) { return x.name.trim(); }); });
        add('lang', function () { return s.languages.some(function (x) { return x.name.trim(); }); });
        add('award', function () { return s.awards.some(function (x) { return x.name.trim(); }); });
        add('act', function () { return s.activities.some(function (x) { return x.title.trim(); }); });
        add('ref', function () { return s.references.some(function (x) { return x.name.trim(); }); });
        add('additional', function () { return !!s.additional.text.trim(); });
        return Math.round(got / total * 100);
    }

    function collectText() {
        var s = state;
        var parts = [s.personal.fullName, s.personal.jobTitle, s.objective.summary, s.additional.text];
        s.experience.forEach(function (e) { parts.push(e.title, e.company, e.location, (e.bullets || []).join(' ')); });
        s.education.forEach(function (e) { parts.push(e.school, e.degree, e.field); });
        s.projects.forEach(function (x) { parts.push(x.name, x.description); });
        s.skills.forEach(function (x) { parts.push(x.name); });
        s.certifications.forEach(function (x) { parts.push(x.name, x.issuer); });
        s.languages.forEach(function (x) { parts.push(x.name); });
        s.awards.forEach(function (x) { parts.push(x.name, x.org); });
        s.activities.forEach(function (x) { parts.push(x.title, x.description); });
        s.references.forEach(function (x) { parts.push(x.name); });
        return parts.join(' ');
    }

    function extractKeywords(text) {
        var freq = {};
        var tokens = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}\-_.]*/gu) || [];
        tokens.forEach(function (t) {
            if (t.length < 3) return;
            if (/^[\d\-.]+$/.test(t)) return;
            if (STOPWORDS.has(t)) return;
            freq[t] = (freq[t] || 0) + 1;
        });
        return Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 20);
    }

    function atsCheck() {
        var res = { score: 0, parts: [], suggestions: [], warnings: [] };
        var s = state;
        var cvText = collectText().toLowerCase();
        var wordCount = cvText.split(/\s+/).filter(Boolean).length;
        var hasPlaceholder = /lorem|todo\b|tbd\b|xxx|điền vào|chèn (thêm|nội dung)|placeholder/i.test(collectText());
        var bullets = [];
        s.experience.forEach(function (e) { (e.bullets || []).forEach(function (b) { if (b.trim()) bullets.push(b.trim()); }); });

        var k = 0, kMax = 20, kwNote = '';
        if (s.jd.trim()) {
            var jdTokens = extractKeywords(s.jd);
            if (jdTokens.length) {
                var found = jdTokens.filter(function (t) { return cvText.indexOf(t) !== -1; });
                k = Math.round(20 * found.length / jdTokens.length);
                var missing = jdTokens.filter(function (t) { return cvText.indexOf(t) === -1; }).slice(0, 12);
                if (missing.length) res.suggestions.push('Từ khóa từ mô tả công việc chưa xuất hiện trong CV: ' + missing.join(', ') + '. Nên đưa vào mục tiêu/kỹ năng một cách tự nhiên.');
                if (k >= 14) res.warnings.push('Từ khóa khớp tốt với mô tả công việc.');
            } else { k = 12; kwNote = 'Không trích được từ khóa từ mô tả công việc — dán đoạn văn đầy đủ hơn.'; }
        } else {
            var role = detectRole();
            var roleKw = role ? ROLE_SKILLS[role].filter(function (x) { return cvText.indexOf(x.toLowerCase()) !== -1; }).length : 0;
            k = roleKw >= 2 ? 15 : roleKw === 1 ? 12 : 8;
            res.suggestions.push('Chưa dán mô tả công việc — kiểm tra từ khóa chính xác hơn khi bạn dán JD vào khung bên dưới.');
            if (role && roleKw < 2) res.warnings.push('Bổ sung kỹ năng liên quan vai trò "' + role + '" (xem gợi ý ở mục Trợ lý viết CV).');
        }

        var fmt = 0, fmtMax = 20;
        var secCount = 0;
        if (s.objective.summary.trim()) secCount++;
        if (s.experience.length) secCount++;
        if (s.education.length) secCount++;
        if (s.projects.length) secCount++;
        if (s.skills.length) secCount++;
        if (s.certifications.length) secCount++;
        if (s.languages.length) secCount++;
        if (s.awards.length) secCount++;
        if (s.activities.length) secCount++;
        if (s.references.length) secCount++;
        if (s.additional.text.trim()) secCount++;
        fmt = Math.round(20 * secCount / 11);
        if (hasPlaceholder) { fmt = Math.max(0, fmt - 8); res.warnings.push('Phát hiện văn bản giữ chỗ (lorem/xxx/điền vào...) — thay bằng nội dung thật trước khi nộp.'); }
        if (!s.objective.summary.trim()) res.warnings.push('Thiếu mục tiêu nghề nghiệp — ATS thường dò từ khóa ở phần đầu CV này.');

        var av = 0, avMax = 15;
        if (bullets.length) {
            var strong = bullets.filter(function (b) { return startsWithVerb(b); }).length;
            av = Math.round(15 * strong / bullets.length);
            if (av < 8) res.suggestions.push('Bắt đầu mỗi gạch đầu dòng bằng động từ hành động mạnh (phát triển, triển khai, tối ưu, tăng, giảm, lãnh đạo...).');
        } else if (s.experience.length) {
            res.suggestions.push('Mỗi mục kinh nghiệm nên có 2–4 gạch đầu dòng mô tả công việc/thành tích.');
        }

        var len = 0, lenMax = 15;
        if (wordCount >= 300 && wordCount <= 1000) len = 15;
        else if (wordCount >= 200 && wordCount < 300) { len = 10; res.warnings.push('CV hơi ngắn (' + wordCount + ' từ) — thêm chi tiết thành tích ở mục kinh nghiệm.'); }
        else if (wordCount > 1000) { len = 8; res.warnings.push('CV dài ' + wordCount + ' từ — nhà tuyển dụng ưa hồ sơ 1–2 trang, hãy cô đọng.'); }
        else if (wordCount > 0) { len = 4; res.warnings.push('CV rất ngắn — cần thêm nội dung để đánh giá chính xác.'); }

        var eb = 0, ebMax = 10;
        var exps = s.experience.filter(function (e) { return e.title.trim() && e.company.trim(); });
        if (exps.length >= 1 && exps.length <= 5) eb = 10;
        else if (exps.length === 0) { eb = 0; res.warnings.push('Chưa có kinh nghiệm làm việc — ATS ưu tiên hồ sơ có lịch sử làm việc.'); }
        else if (exps.length > 5) { eb = 6; res.warnings.push('Quá nhiều mục kinh nghiệm (' + exps.length + ') — chỉ giữ 3–5 vị trí gần nhất.'); }
        var dated = exps.filter(function (e) { return e.start; });
        if (exps.length && dated.length < exps.length) { eb = Math.max(0, eb - 3); res.warnings.push('Một số mục kinh nghiệm thiếu mốc thời gian bắt đầu — ATS khó xác định mức kinh nghiệm.'); }

        var ed = 0, edMax = 10;
        var edus = s.education.filter(function (e) { return e.school.trim(); });
        if (edus.length) {
            var full = edus.some(function (e) { return e.school.trim() && e.degree.trim() && e.end; });
            ed = full ? 10 : 6;
            if (!full) res.warnings.push('Bổ sung bằng cấp + năm tốt nghiệp ở mục học vấn để ATS nhận diện đầy đủ.');
        } else { res.warnings.push('Thiếu mục học vấn.'); }

        var sk = 0, skMax = 10;
        var skList = s.skills.filter(function (x) { return x.name.trim(); });
        if (skList.length >= 4) sk = 10;
        else if (skList.length >= 1) { sk = 6; res.suggestions.push('Có ' + skList.length + ' kỹ năng — nên đạt ít nhất 4–6 kỹ năng có trình độ kèm theo.'); }
        else { res.warnings.push('Thiếu mục kỹ năng — ATS dò từ khóa kỹ năng rất mạnh.'); }

        res.parts = [
            { name: 'Từ khóa', score: k, max: kMax },
            { name: 'Định dạng', score: fmt, max: fmtMax },
            { name: 'Động từ hành động', score: av, max: avMax },
            { name: 'Độ dài', score: len, max: lenMax },
            { name: 'Kinh nghiệm', score: eb, max: ebMax },
            { name: 'Học vấn', score: ed, max: edMax },
            { name: 'Kỹ năng', score: sk, max: skMax }
        ];
        res.score = res.parts.reduce(function (a, x) { return a + x.score; }, 0);
        if (kwNote) res.suggestions.push(kwNote);
        return res;
    }

    function startsWithVerb(b) {
        var first = (b.match(/^[\W\d]*([\p{L}][\p{L}\s\-]*?)[\s,]/u) || [null, b.split(/\s+/)[0]])[1].toLowerCase();
        var first2 = b.toLowerCase().split(/\s+/).slice(0, 2).join(' ');
        return ACTION_VERBS.indexOf(first) !== -1 || ACTION_VERBS_VN.indexOf(first) !== -1 ||
            first2 === 'phối hợp' || first2 === 'lãnh đạo' || first2 === 'đảm bảo';
    }

    function detectRole() {
        var hay = (state.personal.jobTitle + ' ' + state.objective.summary + ' ' + collectText()).slice(0, 400);
        for (var i = 0; i < ROLE_PATTERNS.length; i++) {
            if (ROLE_PATTERNS[i][0].test(hay)) return ROLE_PATTERNS[i][1];
        }
        return null;
    }

    function recruiterScore(completion, ats) {
        var s = state;
        var score = 30 + completion * 0.3 + ats * 0.35;
        if (/^\S+@\S+\.\S+$/.test(s.personal.email.trim())) score += 5;
        if (/[0-9+()\-\s]{8,}/.test(s.personal.phone.trim())) score += 5;
        if (s.personal.linkedin.trim()) score += 5;
        if (s.personal.website.trim()) score += 3;
        if (s.languages.length) score += 4;
        if (s.certifications.length) score += 3;
        if (s.references.length) score += 5;
        if (hasQuantifiedBullet()) score += 5;
        var hasSig = s.experience.some(function (e) {
            return (e.bullets || []).some(function (b) { return /\d|%/.test(b); });
        });
        if (hasSig) score += 5;
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    function hasQuantifiedBullet() {
        return state.experience.some(function (e) {
            return (e.bullets || []).some(function (b) { return /\d/.test(b); });
        });
    }

    function updateKPIs() {
        var miss = requiredList();
        var completion = completionPct();
        var ats = atsCheck();
        var rec = recruiterScore(completion, ats.score);
        $('#kpi-completion').textContent = completion + '%';
        $('#kpi-missing').textContent = miss.length;
        $('#kpi-ats').textContent = ats.score;
        $('#kpi-recruiter').textContent = rec;
        var bar = $('#cvgen-progress-fill');
        bar.style.width = completion + '%';
        bar.setAttribute('aria-valuenow', String(completion));
        renderAts(ats);
        updateValidationUI(miss);
        updateBanner(miss);
    }

    function renderAts(ats) {
        var num = $('#ats-score');
        num.textContent = ats.score + '/100';
        num.style.color = ats.score >= 80 ? 'var(--cvgen-success)' : ats.score >= 55 ? 'var(--cvgen-accent)' : 'var(--cvgen-danger)';
        $('#ats-detail').innerHTML = ats.parts.map(function (p) {
            return '<span><strong>' + p.score + '/' + p.max + '</strong> ' + esc(p.name) + '</span>';
        }).join('');
        var list = ats.suggestions.map(function (t) { return '<li class="is-good">' + esc(t) + '</li>'; })
            .concat(ats.warnings.map(function (t) { return '<li class="is-warn">' + esc(t) + '</li>'; }));
        $('#ats-suggestions').innerHTML = list.join('');
    }

    function updateValidationUI(miss) {
        $$('.cvgen-sec').forEach(function (sec) { sec.classList.remove('is-missing'); });
        $$('#cvgen-form input, #cvgen-form textarea').forEach(function (el) { el.classList.remove('is-invalid'); });
        miss.forEach(function (m) {
            var sec = document.getElementById(m.id);
            if (sec) sec.classList.add('is-missing');
            if (m.field) {
                var el = document.getElementById(m.field);
                if (el) el.classList.add('is-invalid');
            }
        });
    }

    function updateBanner(miss) {
        var banner = $('#cvgen-banner');
        if (!miss.length) { banner.hidden = true; banner.textContent = ''; return; }
        banner.hidden = false;
        banner.className = 'cvgen-banner is-warning';
        banner.innerHTML = '<strong>Còn thiếu ' + miss.length + ' mục bắt buộc:</strong> ' +
            miss.map(function (m) { return '<a href="#' + m.id + '">' + esc(m.label) + '</a>'; }).join(', ');
    }

    function renderAll() {
        renderPreview();
        updateKPIs();
    }

    function scheduleRender() {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(function () { collectState(); renderAll(); scheduleSave(); }, 120);
    }

    function addEntry(listKey) {
        var empty = entryTemplate(listKey, {}, 0);
        var box = $('#' + listKey + '-list');
        var emptyP = $('#' + listKey + '-list .cvgen-empty');
        if (emptyP) emptyP.remove();
        box.insertAdjacentHTML('beforeend', empty);
        var row = box.lastElementChild;
        var first = row.querySelector('input, textarea, select');
        if (first) first.focus();
        collectState();
        renderAll();
    }

    function removeEntry(listKey, idx) {
        var box = $('#' + listKey + '-list');
        var rows = $$('.cvgen-entry', box);
        if (rows[idx]) rows[idx].remove();
        if (!$$('.cvgen-entry', box).length) {
            box.innerHTML = '<p class="cvgen-empty">Chưa có mục nào</p>';
        }
        collectState();
        renderAll();
    }

    function addBullet(listKey, idx) {
        var row = $$('#' + listKey + '-list .cvgen-entry')[idx];
        if (!row) return;
        var ta = document.createElement('textarea');
        ta.setAttribute('data-field', 'bullet');
        ta.setAttribute('placeholder', 'Mô tả công việc / thành tích cụ thể...');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cvgen-bullet-remove';
        btn.setAttribute('data-act', 'bullet-remove');
        btn.setAttribute('data-list', listKey);
        btn.setAttribute('data-idx', String(idx));
        btn.textContent = '✕';
        btn.setAttribute('aria-label', 'Xóa dòng mô tả');
        var wrap = document.createElement('div');
        wrap.className = 'cvgen-bullet-row';
        wrap.appendChild(ta);
        wrap.appendChild(btn);
        $('.cvgen-bullets', row).appendChild(wrap);
        ta.focus();
        collectState();
        renderAll();
    }

    function removeBullet(listKey, idx, bidx) {
        var row = $$('#' + listKey + '-list .cvgen-entry')[idx];
        if (!row) return;
        var rows = $$('.cvgen-bullet-row', row);
        if (rows[bidx]) rows[bidx].remove();
        collectState();
        renderAll();
    }

    function exportGate() {
        var miss = requiredList();
        var hasContent = state.objective.summary.trim() || state.experience.length || state.education.length ||
            state.projects.length || state.skills.length || state.certifications.length || state.languages.length ||
            state.awards.length || state.activities.length || state.references.length || state.additional.text.trim();
        if (!state.personal.fullName.trim()) return 'Nhập họ và tên trước khi xuất CV.';
        if (!hasContent) return 'CV đang trống — điền ít nhất một mục nội dung trước khi xuất.';
        if (miss.length) {
            toast('CV còn thiếu mục bắt buộc (' + miss.length + ') — đã tô đỏ trên form. Bạn vẫn có thể xuất nếu muốn.', true);
        }
        return null;
    }

    function fitPreview() {
        clearTimeout(fitTimer);
        fitTimer = setTimeout(function () {
            var wrap = $('#cv-preview-wrap');
            var page = $('#cv-preview');
            if (!wrap || !page) return;
            var avail = wrap.clientWidth - 20;
            if (window.matchMedia('(max-width: 920px)').matches) {
                page.style.transform = 'none';
                wrap.style.height = 'auto';
                return;
            }
            var scale = Math.max(0.3, Math.min(1, avail / PAGE_W));
            page.style.transform = 'scale(' + scale + ')';
            wrap.style.height = (page.scrollHeight * scale + 24) + 'px';
        }, 80);
    }

    function downloadBlob(blob, name) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }

    function slugify(name) {
        return (name || 'CV').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cv';
    }

    function xmlEscape(s) {
        return esc(s);
    }

    function docxP(text, opts) {
        opts = opts || {};
        var pPr = '<w:pPr>';
        if (opts.bold || opts.color || opts.size) {
            pPr += '<w:rPr>' + (opts.bold ? '<w:b/>' : '') +
                (opts.color ? '<w:color w:val="' + opts.color + '"/>' : '') +
                (opts.size ? '<w:sz w:val="' + opts.size + '"/><w:szCs w:val="' + opts.size + '"/>' : '') +
                (opts.italic ? '<w:i/>' : '') + '</w:rPr>';
        }
        if (opts.border) {
            pPr += '<w:pBdr><w:bottom w:val="single" w:sz="' + (opts.borderSz || 6) + '" w:space="1" w:color="' + (opts.borderColor || '2563EB') + '"/></w:pBdr>';
        }
        pPr += '<w:spacing w:before="' + (opts.before != null ? opts.before : 0) + '" w:after="' + (opts.after != null ? opts.after : 80) + '"/>';
        if (opts.ind) pPr += '<w:ind w:left="' + opts.ind + '"/>';
        pPr += '<w:jc w:val="' + (opts.jc || 'left') + '"/>';
        pPr += '</w:pPr>';
        return '<w:p>' + pPr + '<w:r><w:rPr>' + (opts.bold ? '<w:b/>' : '') +
            (opts.color ? '<w:color w:val="' + opts.color + '"/>' : '') +
            (opts.size ? '<w:sz w:val="' + opts.size + '"/><w:szCs w:val="' + opts.size + '"/>' : '') +
            (opts.italic ? '<w:i/>' : '') + '</w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>';
    }

    function docxSection(title) {
        return docxP(title, { bold: true, size: 22, color: '1F2937', border: true, borderSz: 8, borderColor: '2563EB', before: 240, after: 100 });
    }

    function buildDocx() {
        var s = state;
        var lang = (s.ui && s.ui.lang === 'en') ? 'en' : 'vi';
        var L = T[lang];
        var body = [];

        var nameRuns = '<w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="0F172A"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(s.personal.fullName || 'Họ và tên') + '</w:t></w:r>';
        var jobRuns = s.personal.jobTitle ? '<w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="2563EB"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(s.personal.jobTitle) + '</w:t></w:r>' : '';
        var contactParts = [];
        if (s.personal.email) contactParts.push(s.personal.email);
        if (s.personal.phone) contactParts.push(s.personal.phone);
        if (s.personal.address) contactParts.push(s.personal.address);
        if (s.personal.linkedin) contactParts.push(stripScheme(s.personal.linkedin));
        if (s.personal.website) contactParts.push(stripScheme(s.personal.website));
        var extra = [];
        if (s.personal.birthDate) extra.push(L.birth + ': ' + fmtDateFull(s.personal.birthDate, lang));
        if (s.personal.nationality) extra.push(L.nat + ': ' + s.personal.nationality);
        if (extra.length) contactParts.push(extra.join(' · '));
        var contactRuns = '<w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="475569"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(contactParts.join(' | ')) + '</w:t></w:r>';

        var headCell = '<w:tc><w:tcPr><w:tcW w:w="7938" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>' +
            '<w:p><w:pPr><w:spacing w:after="40"/></w:pPr>' + nameRuns + '</w:p>' +
            (jobRuns ? '<w:p><w:pPr><w:spacing w:after="80"/></w:pPr>' + jobRuns + '</w:p>' : '') +
            '<w:p>' + contactRuns + '</w:p></w:tc>';

        var photoCell = '<w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/>' +
            '<w:tcBorders><w:top w:val="single" w:sz="4" w:color="94A3B8"/><w:left w:val="single" w:sz="4" w:color="94A3B8"/>' +
            '<w:bottom w:val="single" w:sz="4" w:color="94A3B8"/><w:right w:val="single" w:sz="4" w:color="94A3B8"/></w:tcBorders>' +
            '<w:vAlign w:val="center"/><w:tcMar><w:top w:w="200" w:type="dxa"/><w:bottom w:w="200" w:type="dxa"/>' +
            '<w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar></w:tcPr>' +
            '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="1400" w:after="1400"/></w:pPr>' +
            '<w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:color w:val="64748B"/></w:rPr>' +
            '<w:t xml:space="preserve">' + xmlEscape(L.attach) + '</w:t></w:r></w:p>' +
            '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:color w:val="94A3B8"/></w:rPr>' +
            '<w:t xml:space="preserve">3x4</w:t></w:r></w:p></w:tc>';

        body.push('<w:tbl><w:tblPr><w:tblW w:w="9638" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr>' +
            '<w:tblGrid><w:gridCol w:w="7938"/><w:gridCol w:w="1700"/></w:tblGrid>' +
            '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + headCell + photoCell + '</w:tr></w:tbl>');

        if (s.objective.summary.trim()) {
            body.push(docxSection(L.obj));
            body.push(docxP(s.objective.summary.trim(), { after: 120 }));
        }

        var exps = s.experience.filter(function (e) { return e.title.trim() || e.company.trim(); });
        if (exps.length) {
            body.push(docxSection(L.exp));
            exps.forEach(function (e) {
                body.push(docxP([e.title, e.company].filter(Boolean).join(' — '), { bold: true, after: 20 }));
                var meta = [e.location, periodLabel(e.start, e.end, e.current, lang)].filter(Boolean).join(' · ');
                if (meta) body.push(docxP(meta, { italic: true, color: '64748B', size: 18, after: 60 }));
                (e.bullets || []).forEach(function (b) {
                    if (b.trim()) body.push(docxP('•  ' + b.trim(), { ind: 360, after: 40 }));
                });
            });
        }

        var edus = s.education.filter(function (e) { return e.school.trim() || e.degree.trim(); });
        if (edus.length) {
            body.push(docxSection(L.edu));
            edus.forEach(function (e) {
                var deg = [e.degree, e.field].filter(Boolean).join(', ');
                body.push(docxP(deg || e.school, { bold: true, after: 20 }));
                var meta = [e.school, periodLabel(e.start, e.end, false, lang), e.gpa ? 'GPA: ' + e.gpa : ''].filter(Boolean).join(' · ');
                if (meta) body.push(docxP(meta, { italic: true, color: '64748B', size: 18, after: 80 }));
            });
        }

        var projs = s.projects.filter(function (x) { return x.name.trim(); });
        if (projs.length) {
            body.push(docxSection(L.proj));
            projs.forEach(function (x) {
                body.push(docxP(x.name + (x.link ? ' — ' + stripScheme(x.link) : ''), { bold: true, after: 20 }));
                if (x.description.trim()) body.push(docxP(x.description.trim(), { after: 80 }));
            });
        }

        var skills = s.skills.filter(function (x) { return x.name.trim(); });
        if (skills.length) {
            body.push(docxSection(L.skills));
            body.push(docxP(skills.map(function (x) { return x.name + (x.level ? ' (' + (L.lvl[x.level] || x.level) + ')' : ''); }).join(', '), { after: 120 }));
        }

        var certs = s.certifications.filter(function (x) { return x.name.trim(); });
        if (certs.length) {
            body.push(docxSection(L.cert));
            certs.forEach(function (x) {
                body.push(docxP('•  ' + x.name + (x.issuer ? ' — ' + x.issuer : '') + (x.year ? ' (' + x.year + ')' : ''), { ind: 360, after: 40 }));
            });
        }

        var langs = s.languages.filter(function (x) { return x.name.trim(); });
        if (langs.length) {
            body.push(docxSection(L.lang));
            langs.forEach(function (x) {
                body.push(docxP('•  ' + x.name + (x.level ? ' — ' + (L.lvl[x.level] || x.level) : ''), { ind: 360, after: 40 }));
            });
        }

        var awards = s.awards.filter(function (x) { return x.name.trim(); });
        if (awards.length) {
            body.push(docxSection(L.award));
            awards.forEach(function (x) {
                body.push(docxP('•  ' + x.name + (x.org ? ' — ' + x.org : '') + (x.year ? ' (' + x.year + ')' : ''), { ind: 360, after: 40 }));
            });
        }

        var acts = s.activities.filter(function (x) { return x.title.trim(); });
        if (acts.length) {
            body.push(docxSection(L.act));
            acts.forEach(function (x) {
                body.push(docxP(x.title + (x.org ? ' — ' + x.org : ''), { bold: true, after: 20 }));
                if (x.description.trim()) body.push(docxP(x.description.trim(), { after: 80 }));
            });
        }

        var refs = s.references.filter(function (x) { return x.name.trim(); });
        if (refs.length) {
            body.push(docxSection(L.ref));
            refs.forEach(function (x) {
                body.push(docxP(x.name + (x.title || x.company ? ' — ' + [x.title, x.company].filter(Boolean).join(', ') : '') +
                    (x.email || x.phone ? ' (' + [x.email, x.phone].filter(Boolean).join(' • ') + ')' : ''), { after: 60 }));
            });
        }

        if (s.additional.text.trim()) {
            body.push(docxSection(L.add));
            body.push(docxP(s.additional.text.trim(), { after: 120 }));
        }

        var sectPr = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>';

        var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:body>' + body.join('') + sectPr + '</w:body></w:document>';

        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
            '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
            '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
            '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
            '</Types>';

        var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
            '</Relationships>';

        var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/core-properties" Target="../docProps/core.xml"/>' +
            '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="../docProps/app.xml"/>' +
            '</Relationships>';

        var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:docDefaults><w:rPrDefault><w:rPr>' +
            '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>' +
            '<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>' +
            '<w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
            '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
            '</w:styles>';

        var coreXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '<dc:title>' + xmlEscape(s.personal.fullName || 'CV') + '</dc:title>' +
            '<dc:creator>CV Generator - Duy Nguyen Blog</dc:creator>' +
            '<cp:lastModifiedBy>CV Generator</cp:lastModifiedBy>' +
            '</cp:coreProperties>';

        var appXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
            '<Application>Duy Nguyen CV Generator</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop>' +
            '<HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Theme</vt:lpstr></vt:variant><vt:variant><vt:i4>0</vt:i4></vt:variant></vt:vector></HeadingPairs>' +
            '<TitlesOfParts><vt:vector size="0" baseType="lpstr"></vt:vector></TitlesOfParts>' +
            '</Properties>';

        var zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', rootRels);
        zip.file('word/document.xml', documentXml);
        zip.file('word/_rels/document.xml.rels', docRels);
        zip.file('word/styles.xml', stylesXml);
        zip.file('docProps/core.xml', coreXml);
        zip.file('docProps/app.xml', appXml);
        return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
            .then(function (blob) {
                downloadBlob(blob, 'CV-' + slugify(s.personal.fullName) + '.docx');
            });
    }

    var reWord = /[\p{L}\p{N}]+/gu;

    function replaceAllWords(text, map) {
        var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
        var out = String(text);
        keys.forEach(function (k) {
            var re = new RegExp('(?<![\\p{L}\\p{N}])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\p{N}])', 'giu');
            out = out.replace(re, map[k]);
        });
        return out;
    }

    function stripFillers(text) {
        var count = 0;
        var out = text;
        FILLERS_VN.forEach(function (f) {
            var re = new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
            var pre = out;
            out = out.replace(re, function () { count++; return ''; });
            out = out.replace(/\s{2,}/g, ' ');
        });
        FILLERS_EN.forEach(function (f) {
            var re = new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
            out = out.replace(re, function () { count++; return ''; });
        });
        out = out.replace(/\s{2,}/g, ' ').replace(/\s([,.;:!?])/g, '$1');
        return { text: out.trim(), count: count };
    }

    function detectLang(text) {
        var viHits = (text.match(/[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/g) || []).length;
        var enHits = (text.match(/\b(the|and|with|for|was|were|team|company|project|sales|marketing|development|client|customer|market|product|design|data|support|business|managed|worked|experience|skills)\b/gi) || []).length;
        return viHits > enHits ? 'vi' : 'en';
    }

    function stripFirstPerson(text, lang) {
        var out = String(text);
        lang = lang || detectLang(out);
        var B = '(?<![\\p{L}\\p{N}])';
        if (lang === 'vi') {
            out = out
                .replace(new RegExp(B + '(Tôi|Em)\\s+(đã|sẽ|thường|luôn)\\s+', 'giu'), '')
                .replace(new RegExp(B + '(Tôi|Em)\\s+(là|được|bị)\\s+', 'giu'), '')
                .replace(new RegExp(B + 'Tôi\\s+', 'giu'), '')
                .replace(new RegExp(B + 'Em\\s+', 'giu'), '')
                .replace(new RegExp(B + 'Tôi là', 'giu'), 'Là');
        } else {
            out = out
                .replace(new RegExp(B + 'As an? (?!result\\b)[A-Za-z]+(?: [A-Za-z]+)*,\\s+', 'giu'), '')
                .replace(new RegExp(B + 'I\\s+(have|had|was|am|will|would|can|could|used)\\s+', 'giu'), '')
                .replace(new RegExp(B + 'My\\s+(role|job|duty|responsibilities?|main task)\\s+(was|were|is|are|included)\\s+', 'giu'), '')
                .replace(new RegExp(B + 'I\\s+', 'giu'), '')
                .replace(new RegExp(B + 'my\\s+(team|role|responsibility|duties?|job|task)\\s+(at|of|with|in|was|were|is|are)\\s+', 'giu'), '');
        }
        return out.charAt(0).toUpperCase() + out.slice(1);
    }

    var EN_GERUND_PAST = {
        'managing': 'managed', 'developing': 'developed', 'building': 'built', 'creating': 'created',
        'designing': 'designed', 'implementing': 'implemented', 'handling': 'handled',
        'overseeing': 'oversaw', 'leading': 'led', 'coordinating': 'coordinated',
        'supporting': 'supported', 'launching': 'launched', 'running': 'ran', 'growing': 'grew',
        'improving': 'improved', 'increasing': 'increased', 'reducing': 'reduced', 'testing': 'tested',
        'writing': 'wrote', 'reporting': 'reported', 'analyzing': 'analyzed', 'planning': 'planned',
        'training': 'trained', 'recruiting': 'recruited', 'preparing': 'prepared', 'reviewing': 'reviewed'
    };

    var EN_TO_PAST = {
        'support': 'supported', 'manage': 'managed', 'handle': 'handled', 'coordinate': 'coordinated',
        'oversee': 'oversaw', 'develop': 'developed', 'lead': 'led', 'assist': 'assisted',
        'prepare': 'prepared', 'maintain': 'maintained', 'monitor': 'monitored', 'analyze': 'analyzed',
        'plan': 'planned', 'organize': 'organized', 'train': 'trained', 'recruit': 'recruited',
        'write': 'wrote', 'update': 'updated', 'review': 'reviewed', 'report': 'reported',
        'run': 'ran', 'grow': 'grew', 'improve': 'improved', 'increase': 'increased',
        'reduce': 'reduced', 'launch': 'launched', 'build': 'built', 'design': 'designed',
        'test': 'tested', 'create': 'created', 'implement': 'implemented', 'negotiate': 'negotiated',
        'deliver': 'delivered', 'produce': 'produced', 'establish': 'established', 'execute': 'executed',
        'facilitate': 'facilitated', 'promote': 'promoted', 'optimize': 'optimized', 'restructure': 'restructured',
        'resolve': 'resolved', 'document': 'documented', 'budget': 'budgeted', 'forecast': 'forecasted'
    };

    function fixEnGerund(text) {
        var t = String(text);
        t = t
            .replace(/\b(?:was\s+)?(?:responsible|in\s+charge)\s+(?:for|of)\s+(\w+ing)\b/gi, function (m, g) {
                return EN_GERUND_PAST[g.toLowerCase()] || m;
            })
            .replace(/\bworked\s+on\s+(\w+ing)\b/gi, function (m, g) {
                return EN_GERUND_PAST[g.toLowerCase()] || m;
            })
            .replace(/\bwas\s+tasked\s+with\s+(\w+ing)\b/gi, function (m, g) {
                return EN_GERUND_PAST[g.toLowerCase()] || m;
            })
            .replace(/\bhelped\s+(?:to\s+)?(?:with\s+)?(\w+ing)\b/gi, function (m, g) {
                return EN_GERUND_PAST[g.toLowerCase()] || m;
            })
            .replace(/\b(?:my\s+)?(?:role|job|duty|responsibilities?|main\s+task)\s+(?:was|were|is|are)\s+to\s+(\w+)\b/gi, function (m, g) {
                return EN_TO_PAST[g.toLowerCase()] || m;
            })
            .replace(/\bwas\s+to\s+(\w+)\b/gi, function (m, g) {
                return EN_TO_PAST[g.toLowerCase()] || m;
            });
        return t;
    }

    function cleanSentence(text, lang) {
        var t = String(text);
        lang = lang || detectLang(t);
        if (lang === 'en') t = fixEnGerund(t);
        t = stripFirstPerson(t, lang);
        t = replaceAllWords(t, lang === 'vi' ? VN_WEAK : EN_WEAK);
        t = t.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
        if (t && /^[a-zđẹ]/.test(t)) t = t.charAt(0).toUpperCase() + t.slice(1);
        if (t && !/[.!?]$/.test(t)) t += '.';
        return t;
    }

    function smartRewrite(text, lang) {
        var t = String(text);
        lang = lang || detectLang(t);
        var n = 0;
        t = t.replace(/^(Tôi|Em|I)\s+/, function (m) { n++; return ''; });
        t = t.replace(/\b(Tôi|I)\s+(đã|sẽ|đang|have|had|was|am|will)\s+/gi, function (m) { n++; return ''; });
        t = cleanSentence(t, lang);
        if (t && /^[a-z]/.test(t)) t = t.charAt(0).toUpperCase() + t.slice(1);
        return { text: t, changed: n };
    }

    function applyRewriteAll() {
        var n = 0;
        var apply = function (t) {
            if (!t || !t.trim()) return t;
            var r = smartRewrite(t);
            if (r.text !== t.trim()) n++;
            return r.text;
        };
        state.objective.summary = apply(state.objective.summary);
        state.experience.forEach(function (e) {
            e.bullets = (e.bullets || []).map(apply);
        });
        state.projects.forEach(function (x) { x.description = apply(x.description); });
        state.activities.forEach(function (x) { x.description = apply(x.description); });
        state.additional.text = apply(state.additional.text);
        return n;
    }

    function impactBullet(text) {
        var lang = detectLang(text);
        var t = stripFirstPerson(text.trim(), lang);
        var verbed = replaceAllWords(t, lang === 'vi' ? VN_WEAK : EN_WEAK);
        var clauses = verbed.split(/\s*[;,]\s*/).filter(Boolean);
        var metricIdx = -1;
        for (var i = 0; i < clauses.length; i++) {
            if (/\d|%|triệu|tỷ|phần trăm/.test(clauses[i]) && /^(tăng|giảm|tiết kiệm|cải thiện|nâng|đạt|mang|đem|giúp|giảm thiểu|tối ưu|increased|reduced|improved|boosted|cut|grew)/.test(clauses[i])) {
                metricIdx = i;
                break;
            }
        }
        if (metricIdx > 0) {
            var c = clauses.splice(metricIdx, 1)[0];
            clauses.unshift(c);
        }
        var out = clauses.join(', ').replace(/\s{2,}/g, ' ').trim();
        if (!/[.!?]$/.test(out) && !/câu hỏi/.test(out)) out += '.';
        return out;
    }

    function merge() {
        var out = {};
        for (var i = 0; i < arguments.length; i++) {
            Object.keys(arguments[i]).forEach(function (k) { out[k] = arguments[i][k]; });
        }
        return out;
    }

    function grammarReport() {
        var items = [];
        var sections = [];
        if (state.objective.summary.trim()) sections.push(state.objective.summary);
        state.experience.forEach(function (e) { (e.bullets || []).forEach(function (b) { if (b.trim()) sections.push(b); }); });
        state.projects.forEach(function (x) { if (x.description.trim()) sections.push(x.description); });
        state.activities.forEach(function (x) { if (x.description.trim()) sections.push(x.description); });
        state.additional.text.trim() && sections.push(state.additional.text);
        var fixed = 0;

        sections.forEach(function (txt, si) {
            var out = txt;
            var before = out;
            out = out.replace(/[ \t]{2,}/g, ' ');
            out = out.replace(/\s+([,.!?;:])/g, '$1');
            out = out.replace(/([,.!?;:])(?=\p{L})/u, function (m) { return m[0] + ' '; });
            out = out.replace(/\b([\p{L}]{2,})\s+\1\b/giu, '$1');
            if (out !== before) { fixed++; items.push('Đã tự sửa khoảng trắng / lỗi trùng từ trong một đoạn.'); }

            var words = out.match(reWord);
            if (words && words.length > 1) {
                for (var i = 1; i < words.length; i++) {
                    if (words[i].toLowerCase() === words[i - 1].toLowerCase() && words[i].length > 2) {
                        items.push('Trùng từ: "' + words[i - 1] + ' ' + words[i] + '" — chỉ giữ một từ.');
                        break;
                    }
                }
            }
            if (/^[a-z]/.test(out)) items.push('Một đoạn bắt đầu bằng chữ thường — nên viết hoa đầu câu.');
            if (out.length > 240 && !/[.!?。]/.test(out.slice(-6))) items.push('Một đoạn quá dài và không kết thúc bằng dấu câu — nên chia nhỏ.');
        });

        var applyToText = function (fn) {
            var handled = [];
            if (state.objective.summary.trim()) { state.objective.summary = fn(state.objective.summary); handled.push('mục tiêu'); }
            state.experience.forEach(function (e) {
                e.bullets = (e.bullets || []).map(function (b) { return b.trim() ? fn(b) : b; });
            });
            state.projects.forEach(function (x) { if (x.description.trim()) x.description = fn(x.description); });
            state.activities.forEach(function (x) { if (x.description.trim()) x.description = fn(x.description); });
            if (state.additional.text.trim()) state.additional.text = fn(state.additional.text);
            return handled;
        };

        applyToText(function (t) {
            var out = t;
            out = out.replace(/[ \t]{2,}/g, ' ');
            out = out.replace(/\s+([,.!?;:])/g, '$1');
            out = out.replace(/([,.!?;:])(?=\p{L})/u, function (m) { return m[0] + ' '; });
            out = out.replace(/\b([\p{L}]{2,})\s+\1\b/giu, '$1');
            return out.trim();
        });

        if (!items.length) items.push('Không phát hiện lỗi ngữ pháp chính tả phổ biến. Tiếp tục giữ câu ngắn, mạch lạc.');
        return { items: items, fixed: fixed };
    }

    function applyTone() {
        var dict = merge(VN_WEAK, EN_WEAK);
        var n = 0;
        function fn(t) {
            var r = replaceAllWords(t, dict);
            if (r !== t) n++;
            return r;
        }
        state.objective.summary = fn(state.objective.summary);
        state.experience.forEach(function (e) { e.bullets = (e.bullets || []).map(fn); });
        state.projects.forEach(function (x) { x.description = fn(x.description); });
        state.activities.forEach(function (x) { x.description = fn(x.description); });
        state.additional.text = fn(state.additional.text);
        return n;
    }

    function applyShorter() {
        var n = 0;
        function fn(t) {
            var r = stripFillers(t);
            n += r.count;
            return r.text;
        }
        state.objective.summary = fn(state.objective.summary);
        state.experience.forEach(function (e) { e.bullets = (e.bullets || []).map(fn); });
        state.projects.forEach(function (x) { x.description = fn(x.description); });
        state.activities.forEach(function (x) { x.description = fn(x.description); });
        state.additional.text = fn(state.additional.text);
        return n;
    }

    function applyImpact() {
        var n = 0;
        state.experience.forEach(function (e) {
            e.bullets = (e.bullets || []).map(function (b) {
                if (!b.trim()) return b;
                var r = impactBullet(b);
                if (r !== b.trim()) n++;
                return r;
            });
        });
        return n;
    }

    function applyRewriteBullets() {
        var n = 0;
        state.experience.forEach(function (e) {
            e.bullets = (e.bullets || []).map(function (b) {
                if (!b.trim()) return b;
                var r = smartRewrite(b.trim());
                if (r.text !== b.trim()) n++;
                return r.text;
            });
        });
        return n;
    }

    function improveObjective() {
        var lang = (state.ui && state.ui.lang === 'en') ? 'en' : 'vi';
        if (state.objective.summary.trim()) {
            pushUndo();
            var t = cleanSentence(state.objective.summary.trim(), lang);
            state.objective.summary = t;
            return lang === 'en'
                ? 'Career objective rewritten in an active, first-person-free English tone with stronger verbs.'
                : 'Mục tiêu nghề nghiệp đã được viết lại giọng chủ động, bỏ xưng hô "tôi" và nâng cấp động từ.';
        }
        var role = detectRole();
        var skills = state.skills.filter(function (x) { return x.name.trim(); }).slice(0, 3).map(function (x) { return x.name; });
        var years = null;
        var dated = state.experience.filter(function (e) { return e.start && !e.current && e.end; });
        if (dated.length) {
            var y0 = Math.min.apply(null, dated.map(function (e) { return +e.start.slice(0, 4); }));
            var y1 = Math.max.apply(null, dated.map(function (e) { return +e.end.slice(0, 4); }));
            if (y1 >= y0) years = y1 - y0 + 1;
        }
        var name = state.personal.fullName.trim();
        var title = state.personal.jobTitle.trim();
        if (!title && !skills.length && !name) {
            return { warn: lang === 'en' ? 'Fill in at least your name, job title or a few skills so I can draft an objective from your data.' : 'Điền ít nhất họ tên, chức danh hoặc vài kỹ năng để tôi dựng câu mục tiêu từ dữ liệu của bạn.' };
        }
        pushUndo();
        if (lang === 'en') {
            var eparts = [];
            if (title) eparts.push('A dedicated ' + title);
            if (years && years >= 1) eparts.push(years + ' years of experience');
            if (skills.length) eparts.push('strengths in ' + skills.join(', '));
            var elead = eparts.length ? eparts.join(' with ') + ', seeking to ' : 'Seeking to ';
            state.objective.summary = elead + 'contribute and grow in a professional environment where I can apply my experience to deliver measurable results. Please tailor this to your specific goal.';
            return 'Objective drafted from your data (title, experience, skills) — review and tailor it to the role.';
        }
        var parts = [];
        if (title) parts.push('Là ' + title);
        if (years && years >= 1) parts.push(years + ' năm kinh nghiệm');
        if (skills.length) parts.push('thế mạnh về ' + skills.join(', '));
        var lead = parts.length ? parts.join(' với ') + ', tôi mong muốn ' : 'Tôi mong muốn ';
        state.objective.summary = lead + 'được đóng góp và phát triển trong một môi trường chuyên nghiệp, nơi tôi có thể vận dụng kinh nghiệm để mang lại kết quả rõ ràng cho công việc. Hãy chỉnh sửa câu này cho khớp mục tiêu cụ thể của bạn.';
        return 'Đã dựng mục tiêu từ dữ liệu của bạn (chức danh, kinh nghiệm, kỹ năng) — nhớ chỉnh lại cho khớp thực tế.';
    }

    function improveExperience() {
        var exps = state.experience.filter(function (e) { return e.title.trim(); });
        var n = 0;
        exps.forEach(function (e) {
            e.bullets = (e.bullets || []).map(function (b) {
                if (!b.trim()) return b;
                var r = smartRewrite(b.trim());
                if (r.text !== b.trim()) n++;
                return r.text;
            });
        });
        var emptyExps = exps.filter(function (e) { return !(e.bullets || []).some(function (b) { return b.trim(); }); });
        if (n) pushUndo();
        var msg = n ? 'Đã cải thiện ' + n + ' gạch đầu dòng (bỏ "tôi", nâng cấp động từ).' : 'Không tìm thấy gạch đầu dòng nào để cải thiện.';
        if (emptyExps.length) msg += ' ' + emptyExps.length + ' mục kinh nghiệm đang trống — hãy viết mô tả công việc/thành tích cụ thể trước.';
        return msg;
    }

    function skillSuggestions() {
        var role = detectRole();
        var existing = state.skills.filter(function (x) { return x.name.trim(); }).map(function (x) { return x.name.toLowerCase(); });
        var set = [];
        function add(s) { if (existing.indexOf(s.toLowerCase()) === -1 && set.indexOf(s) === -1) set.push(s); }
        if (role && ROLE_SKILLS[role]) ROLE_SKILLS[role].forEach(add);
        var hay = collectText().toLowerCase();
        KNOWN_TECH.forEach(function (k) {
            if (hay.indexOf(k) !== -1) add(k);
        });
        return { role: role, list: set };
    }

    function achievements() {
        var n = 0;
        state.experience.forEach(function (e) {
            e.bullets = (e.bullets || []).map(function (b) {
                if (!b.trim()) return b;
                var t = impactBullet(b);
                if (t !== b.trim()) n++;
                return t;
            });
        });
        if (n) pushUndo();
        return n ? 'Đã viết lại ' + n + ' gạch đầu dòng theo lối thành tựu: động từ mạnh + kết quả (nếu có số liệu) được đưa lên trước.' :
            'Chưa có gạch đầu dòng nào để xử lý.';
    }

    function showAiOutput(html) {
        var out = $('#ai-output');
        out.innerHTML = html;
        out.hidden = false;
    }

    function aiActions(action) {
        var msg = '';
        switch (action) {
            case 'improve-objective': {
                var r = improveObjective();
                if (typeof r === 'string') { msg = r; }
                else { showAiOutput('<strong>' + r.warn + '</strong>'); return; }
                break;
            }
            case 'improve-experience': msg = improveExperience(); break;
            case 'rewrite-all': {
                var na = applyRewriteAll();
                msg = na ? 'Đã viết lại ' + na + ' đoạn văn bản (tự nhận diện tiếng Việt/Tiếng Anh, bỏ ngôi thứ nhất, nâng cấp động từ).' : 'Không có đoạn nào cần viết lại.';
                if (na) pushUndo();
                break;
            }
            case 'rewrite-bullets': {
                var n = applyRewriteBullets();
                msg = n ? 'Đã viết lại ' + n + ' gạch đầu dòng.' : 'Không có gạch đầu dòng nào để viết lại.';
                if (n) pushUndo();
                break;
            }
            case 'tone': {
                var nt = applyTone();
                msg = nt ? 'Đã nâng cấp ' + nt + ' cụm từ sang giọng chuyên nghiệp.' : 'Không có cụm từ yếu nào để thay.';
                if (nt) pushUndo();
                break;
            }
            case 'shorter': {
                var ns = applyShorter();
                msg = ns ? 'Đã loại ' + ns + ' từ đệm (rất, vô cùng, thực sự...).' : 'Không có từ đệm nào để loại.';
                if (ns) pushUndo();
                break;
            }
            case 'impact': {
                var ni = applyImpact();
                msg = ni ? 'Đã sắc bén ' + ni + ' gạch đầu dòng.' : 'Không có gạch đầu dòng nào để xử lý.';
                if (ni) pushUndo();
                break;
            }
            case 'grammar': {
                var g = grammarReport();
                msg = g.fixed ? 'Đã tự sửa ' + g.fixed + ' lỗi khoảng trắng/trùng từ. ' : '';
                msg += g.items.join('\n');
                if (g.fixed) pushUndo();
                break;
            }
            case 'ats-opt': {
                var ats = atsCheck();
                var lines = ['Điểm ATS hiện tại: ' + ats.score + '/100.'];
                ats.warnings.forEach(function (w) { lines.push('⚠ ' + w); });
                ats.suggestions.forEach(function (s) { lines.push('→ ' + s); });
                if (!lines.length) lines.push('Không có gợi ý nào.');
                msg = lines.join('\n');
                break;
            }
            case 'skills': {
                var sk = skillSuggestions();
                if (!sk.list.length) { showAiOutput('Không phát hiện gợi ý kỹ năng mới. Thử điền chức danh hoặc dán mô tả công việc.'); return; }
                showAiOutput('<strong>Gợi ý kỹ năng' + (sk.role ? ' cho vai trò "' + sk.role + '"' : '') + ':</strong><br>' + sk.list.join(', ') +
                    '<br><button type="button" class="cvgen-btn cvgen-btn-primary" data-act="ai-add-skills" style="margin-top:8px">+ Thêm tất cả vào mục kỹ năng</button>');
                return;
            }
            case 'achievements': msg = achievements(); break;
            case 'undo': {
                if (!undoStack.length) { showAiOutput('Không còn thao tác nào để hoàn tác.'); return; }
                state = undoStack.pop();
                msg = 'Đã hoàn tác thao tác gần nhất.';
                break;
            }
            default: return;
        }
        applyStateToForm();
        renderAll();
        scheduleSave();
        showAiOutput(msg);
    }

    function addSuggestedSkills() {
        var sk = skillSuggestions();
        if (!sk.list.length) return;
        pushUndo();
        sk.list.forEach(function (name) {
            state.skills.push({ id: uid(), name: name, level: '' });
        });
        applyStateToForm();
        renderAll();
        scheduleSave();
        toast('Đã thêm ' + sk.list.length + ' kỹ năng vào mục kỹ năng — bổ sung trình độ cho từng mục.');
    }

    function init() {
        loadDraft();
        var theme = 'light';
        try { theme = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) { }
        var root = $('#cvgen');
        root.setAttribute('data-theme', theme);
        var themeBtn = $('#cvgen-theme');
        themeBtn.textContent = theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối';

        applyStateToForm();
        cvgenEmptyStyle();
        renderAll();
        fitPreview();

        $('#cvgen-form').addEventListener('submit', function (e) { e.preventDefault(); });
        $('#cvgen-form').addEventListener('input', function (e) {
            var t = e.target;
            if (t.matches('[data-bind]') || t.matches('[data-field]')) scheduleRender();
        });

        $('#cvgen-form').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;
            var act = btn.getAttribute('data-act');
            var list = btn.getAttribute('data-list');
            var idx = btn.getAttribute('data-idx');
            var bidx = btn.getAttribute('data-bidx');
            if (act === 'add') addEntry(list);
            else if (act === 'remove') removeEntry(list, +idx);
            else if (act === 'bullet-add') addBullet(list, +idx);
            else if (act === 'bullet-remove') removeBullet(list, +idx, +bidx);
            else if (act === 'ai-add-skills') addSuggestedSkills();
            scheduleSave();
        });

        var form = $('#cvgen-form');
        form.addEventListener('change', function (e) {
            if (e.target.matches('[data-bind]') || e.target.matches('[data-field]')) scheduleRender();
        });

        $('#cvgen').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-ai]');
            if (btn) aiActions(btn.getAttribute('data-ai'));
        });

        $('#btn-pdf').addEventListener('click', function () {
            collectState();
            var err = exportGate();
            if (err) { toast(err, true); return; }
            renderAll();
            window.print();
        });

        $('#btn-print').addEventListener('click', function () {
            collectState();
            renderAll();
            window.print();
        });

        $('#btn-docx').addEventListener('click', function () {
            collectState();
            var err = exportGate();
            if (err) { toast(err, true); return; }
            renderAll();
            if (typeof JSZip === 'undefined') { toast('Thư viện xuất DOCX chưa tải xong — thử lại.', true); return; }
            buildDocx().catch(function () { toast('Xuất DOCX thất bại — thử lại.', true); });
        });

        $('#btn-reset').addEventListener('click', function () {
            if (!window.confirm('Xóa toàn bộ dữ liệu CV đã nhập và bắt đầu lại?')) return;
            try { localStorage.removeItem(LS_KEY); } catch (e) { }
            state = blankState();
            undoStack = [];
            applyStateToForm();
            renderAll();
            scheduleSave();
            toast('Đã đặt lại CV. Bản nháp cũ đã xóa.');
        });

        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            themeBtn.textContent = next === 'dark' ? 'Chế độ sáng' : 'Chế độ tối';
            try { localStorage.setItem(THEME_KEY, next); } catch (e) { }
        });

        window.addEventListener('resize', fitPreview);
        window.addEventListener('beforeprint', fitPreview);
        setTimeout(fitPreview, 400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
