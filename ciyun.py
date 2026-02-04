import re
import jieba
import nltk
from wordcloud import WordCloud
import matplotlib.pyplot as plt
from nltk.corpus import stopwords
import pandas as pd

# 下载英文停用词（首次运行需执行）
nltk.download('stopwords')
english_stopwords = set(stopwords.words('english'))
# 中文停用词（补充访谈相关无关词汇）
chinese_stopwords = {
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
    'this', 'that', 'these', 'those', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
    'could', 'may', 'might', 'can', 'must', 'should', 'what', 'which', 'who', 'whom', 'whose', 'how', 'why',
    'when', 'where', 'there', 'here', 'all', 'any', 'both', 'each', 'every', 'no', 'not', 'some', 'such',
    'only', 'just', 'very', 'so', 'too', 'enough', 'more', 'most', 'less', 'least', 'many', 'much', 'few',
    'little', 'one', 'two', 'three', 'first', 'second', 'last', 'next', 'then', 'now', 'then', 'again',
    'also', 'even', 'still', 'almost', 'nearly', 'about', 'around', 'above', 'below', 'between', 'among',
    'from', 'into', 'onto', 'out', 'off', 'up', 'down', 'over', 'under', 'through', 'across', 'along',
    'before', 'after', 'during', 'while', 'until', 'since', 'because', 'so', 'therefore', 'however', 'though',
    'although', 'if', 'whether', 'unless', 'once', 'as', 'than', 'like', 'such', 'same', 'other', 'another',
    'some', 'any', 'no', 'none', 'all', 'both', 'each', 'every', 'either', 'neither', 'many', 'much', 'few',
    'little', 'most', 'more', 'less', 'least', 'own', 'same', 'different', 'similar', 'various', 'several',
    'many', 'few', 'some', 'any', 'all', 'none', 'each', 'every', 'either', 'neither', 'one', 'two', 'three',
    # 中文停用词
    '的', '了', '是', '在', '有', '就', '不', '和', '也', '都', '这', '那', '要', '能', '会', '可', '以', '及',
    '与', '等', '或', '而', '所', '对', '为', '因', '由', '到', '从', '当', '把', '被', '让', '使', '着', '过',
    '去', '来', '还', '又', '再', '只', '才', '很', '挺', '太', '更', '最', '越', '极', '全', '总', '整', '各',
    '每', '连', '也', '却', '虽', '然', '但', '是', '若', '如', '倘', '若', '即', '便', '则', '就', '因', '为',
    '所', '以', '之', '其', '他', '她', '它', '们', '我', '你', '他', '我们', '你们', '他们', '自己', '别人',
    '大家', '各位', '各位', '一些', '有些', '各个', '种种', '凡是', '所有', '一切', '任何', '无论', '不管',
    '即使', '尽管', '不管', '无论', '只要', '只有', '除非', '既然', '因为', '所以', '因此', '因而', '于是',
    '然后', '接着', '终于', '最后', '首先', '其次', '例如', '比如', '诸如', '像', '好像', '仿佛', '似乎',
    '显得', '觉得', '认为', '知道', '了解', '明白', '清楚', '记得', '忘记', '想起', '说到', '提到', '听说',
    '看到', '听到', '感到', '觉得', '发现', '出现', '发生', '产生', '变成', '成为', '变得', '开始', '结束',
    '进行', '完成', '实现', '达到', '得到', '获得', '失去', '缺少', '需要', '需求', '要求', '希望', '愿望',
    # 访谈专用无关词
    'interviewee', 'interviewer', 'way', 'abi', 'jane', 'goode', 'rebecca', 'rajeshwari', 'mrs', 'kanaka',
    'zhang', 'yanjie', 'qin', 'grandmother', 'grandpa', 'father', 'mother', 'daughter', 'son', 'aunt',
    'lady', 'man', 'woman', 'people', 'person', 'elderly', 'old', 'young', 'year', 'month', 'day', 'time',
    'hour', 'minute', 'second', 'now', 'then', 'today', 'yesterday', 'tomorrow', 'here', 'there', 'where',
    'what', 'how', 'why', 'when', 'which', 'who', 'whom', 'whose', 'do', 'does', 'did', 'make', 'take', 'get',
    'give', 'go', 'come', 'say', 'speak', 'talk', 'tell', 'ask', 'answer', 'know', 'think', 'feel', 'see',
    'hear', 'look', 'watch', 'listen', 'read', 'write', 'eat', 'drink', 'cook', 'wash', 'clean', 'wear',
    'put', 'take', 'open', 'close', 'turn', 'press', 'pull', 'push', 'hold', 'carry', 'move', 'walk', 'run',
    'sit', 'stand', 'lie', 'sleep', 'rest', 'work', 'study', 'play', 'live', 'stay', 'leave', 'arrive', 'depart'
}

# 合并所有停用词
all_stopwords = english_stopwords.union(chinese_stopwords)

# 读取8份文档内容（此处直接复制文档核心文本，若有本地文件可替换为文件读取）
documents = [
    # 文档1：Becky访谈
    "One lady loses ability in her hands, hands shaking constantly, losing sensation, cooking shopping showering dangerous, lack of strength in arms and hands, grip things, opening jars, making a cup of tea difficult, smash hazard, insecure ashamed embarrassed, cooking with open hob risky, carrying heavy bags hazard, sewing, long walks, technology barrier, instructions clear, buttons",
    # 文档2：Rajeshwari医生访谈
    "Parkinson’s ALS peripheral neuropathy carpal tunnel syndrome, nerve damage strokes tendonitis involuntary tremors, claw fingers, cramping hand muscles inflammation finger joints weakening wrist, thumb affected, fine motor control, Activities of Daily Living ADL, gardening shopping carry heavy things, cutting vegetables handling kitchen tools combing hair putting on make-up, pressure cookers hot utensils, carrom flipping pages writing painting drawing knitting plucking weaving garlands de-stemming spinach picking stones from rice, exercise balls, robotics robot-assisted rehabilitation, Ayurvedic techniques massage specific oils hot wax treatment, early intervention physiotherapist",
    # 文档3：Mrs Kanaka访谈
    "Loss in strength, objects could not be gripped, fingers swollen, rheumatoid arthritis, cold weather pain swelling returns, layer up against cold take meds do exercises, technology hesitant",
    # 文档4：Jane Goode访谈（Doreen中风）
    "stroke severe right side weakness, limited use of hand fingers thumb, brushing hair brushing teeth cleaning face washing getting dressed doing up buttons, cooking opening cans carrying hot plates, opening jars lids, chopping, electric can openers jar grip aids, loosening lids in advance, physio balls, alarm clock, loss of independence, reliant on others, falling, hypothermia, slow healing",
    # 文档5：秦姓照护者访谈（父亲类风湿关节炎）
    "rheumatoid arthritis, hands deformed pig trotters chicken claws, can’t straighten, can’t use chopsticks fork spoon, buttoning clothes twisting bottle caps difficult, sensitive to cold, fatigue pain, hand grip strengthener, brisk walking Tai Chi, acupuncture moxibustion herbal medicine, hospitalization, fishing carving, negative mood irritable silent, interacts less",
    # 文档6：Zhang Yanjie访谈（奶奶手问题）
    "joint pain, palm pain, fish-fingers area discomfort, thumb pain, varicose veins, thin BMI low, underlying health issues rainy overcast days joint problems, protein supplementation inadequate, buttoning neck buttons, rolling dumpling wrappers wrapping dumplings, knitting sweaters scrolling phone thumb pain, bottle opener, traditional Chinese medicine acupuncture heat therapy, Yunnan Baiyao pain-relieving plaster, hand exoskeleton glove rehabilitation training, psychological counseling",
    # 文档7：Zhang Yanjie访谈（奶奶多基础病）
    "picking small pieces meat peanuts drop easily, buttoning clothes tying shoelaces slower, needlework threading needle difficult, writing hand shaky, picking up things slip, hypertension rheumatism dementia tendency, brushing teeth twisting toothpaste cap difficult, washing face not thorough, finger exercises cognitive training, irritable self-doubting afraid of bothering others, lack of value, gloves online support tools, rehabilitation hospitals geriatric departments, medical insurance",
    # 文档8：爷爷手僵硬访谈
    "hand stiff, winter keep warm, zipping up clothes left hand hold bottom clumsy, carrying basket tie string right hand, twist hand back and forth 500 times a day, driving stopped, security guard, two-wheeled electric bikes bicycles, washing picking over vegetables troublesome, picking out impurities difficult, tech products smart bracelets assistive tools reasonable price willing to try"
]

# 文本清洗函数：去除特殊字符、数字、多余空格
def clean_text(text):
    # 去除非中英文字符（保留空格）
    text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z\s]', '', text)
    # 去除数字
    text = re.sub(r'\d+', '', text)
    # 去除多余空格
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# 合并并清洗所有文本
combined_text = ' '.join([clean_text(doc) for doc in documents])

# 中英文分词
def segment_text(text):
    # 中文分词
    chinese_words = jieba.lcut(text)
    # 英文分词（按空格分割，转为小写）
    english_words = text.lower().split()
    # 合并所有词汇，过滤停用词和短词（长度<2）
    all_words = chinese_words + english_words
    filtered_words = [
        word for word in all_words
        if word not in all_stopwords and len(word) >= 2
    ]
    return ' '.join(filtered_words)

# 生成处理后的文本
processed_text = segment_text(combined_text)

# 生成词云图
def generate_wordcloud(text, output_path='arthritis_hand_wordcloud.png'):
    # 配置词云参数（支持中英文显示）
    wordcloud = WordCloud(
        width=1200,
        height=800,
        background_color='white',
        font_path='C:/Windows/Fonts/simhei.ttf',  # 中文显示字体（Windows默认），Mac替换为'/System/Library/Fonts/PingFang.ttc'
        max_words=200,
        font_step=2,
        min_font_size=12,
        max_font_size=80,
        random_state=42,
        prefer_horizontal=0.7,  # 70%水平显示
        relative_scaling=0.5
    ).generate(text)

    # 显示并保存词云图
    plt.figure(figsize=(12, 8))
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis('off')
    plt.title('Arthritis & Hand Function Difficulty Word Cloud', fontsize=20, pad=20)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.show()
    print(f"词云图已保存至：{output_path}")

# 运行生成词云
if __name__ == "__main__":
    generate_wordcloud(processed_text)