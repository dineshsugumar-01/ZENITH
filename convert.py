import markdown2
from docx import Document
from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self, doc):
        super().__init__()
        self.doc = doc
        self.current_style = "Normal"
        self.current_p = None
        self.in_list = False

    def handle_starttag(self, tag, attrs):
        if tag == "h1":
            self.current_style = "Heading 1"
        elif tag == "h2":
            self.current_style = "Heading 2"
        elif tag == "h3":
            self.current_style = "Heading 3"
        elif tag == "p":
            self.current_style = "Normal"
        elif tag == "ul":
            self.in_list = True
        elif tag == "li":
            self.current_style = "List Bullet"

    def handle_data(self, data):
        text = data.strip()
        if text:
            if self.current_style == "Normal" or self.current_style.startswith("Heading") or self.current_style == "List Bullet":
                self.doc.add_paragraph(data, style=self.current_style)

    def handle_endtag(self, tag):
        if tag in ["h1", "h2", "h3", "p", "li"]:
            self.current_style = "Normal"
        elif tag == "ul":
            self.in_list = False

with open("ARCHITECTURE_AND_TECH_STACK.md", "r") as f:
    html = markdown2.markdown(f.read())

doc = Document()
parser = MyHTMLParser(doc)
parser.feed(html)
doc.save("ARCHITECTURE_AND_TECH_STACK.docx")
print("Conversion successful.")
