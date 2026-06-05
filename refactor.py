import os

src_dir = 'd:/DA_KHOALUAN/backend/backend/src/main/java/com/khoaluan/backend/controller'

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.java'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if 'GeminiService' in content or 'geminiService' in content:
                content = content.replace('GeminiService', 'SpringAiService')
                content = content.replace('geminiService', 'springAiService')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Refactored {file}")
