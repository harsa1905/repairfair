"""Quick check that your OpenAI key works. Run: python check_ai.py"""
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")
key = os.getenv("OPENAI_API_KEY", "").strip()
model = os.getenv("OPENAI_MODEL", "gpt-6-luna")
if not key:
    raise SystemExit("No OPENAI_API_KEY in .env yet. Copy .env.example to .env and paste your key.")

client = OpenAI(api_key=key, timeout=30)
names = sorted(m.id for m in client.models.list() if m.id.startswith(("gpt", "o")))
print("Some models your key can use:")
for n in [n for n in names if "mini" in n or "nano" in n][:15] or names[:15]:
    print("  ", n)

print(f"\nTesting {model} ...")
r = client.chat.completions.create(model=model, messages=[{"role": "user", "content": "Reply with the word OK."}],
                                   max_completion_tokens=200)
print("Reply:", (r.choices[0].message.content or "").strip())
print("Works. You're ready to run: python app.py")
