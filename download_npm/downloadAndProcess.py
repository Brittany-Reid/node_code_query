import markdown #pip install markdown
from markdown.extensions import Extension
from markdown.inlinepatterns import SimpleTagInlineProcessor
import os
from bleach import clean
import lxml.html.clean
import bs4
from markdown.inlinepatterns import InlineProcessor
from markdown import util
import xml.etree.ElementTree as etree
import math
import urllib.request
import urllib.parse
import json
import shutil
import re

#where to download readmes to
readme_folder = 'readmes'
#where to put proccessed readmes to
html_folder = readme_folder + '/processed'
#sort type
sort = 'dependents_count'
#url to query
url = 'https://libraries.io/api/search?platforms=NPM' #API INFO: https://libraries.io/api
#file to save list to
file_name='popular.json'

#get list of n packages
def getList(n):
    pages = math.floor(n / 101) + 1
    
    combined = []

    #for each page
    for i in range (1, pages+1):
        per = 100 #max 100 per page
        #final per page
        if i == pages:
            per = n % 100
            if per == 0:
                per = 100
        #construct url
        page_url = url + '&sort=' + sort + '&page=' + str(i) + '&per_page=' + str(per) 

        #download
        response = urllib.request.urlopen(page_url)

        #load json file
        data = json.load(response)

        #close download
        response.close()

        #copy json to combined
        j = 0
        while j < len(data):
            combined.append(data[j])
            j += 1

    #save to file
    with open(file_name, 'w') as f:
        json.dump(combined, f, indent=0)


# replace inline code with <tt> tag instead of <code>
# want to maintain inline code, task extractor knows how to deal with <tt> tags
# this is the proper way to do this without a regex

#backtick processor from markdown library
class BacktickInlineProcessor(InlineProcessor):
    """ Return a `<code>` element containing the matching text. """
    def __init__(self, pattern):
        InlineProcessor.__init__(self, pattern)
        self.ESCAPED_BSLASH = '{}{}{}'.format(util.STX, ord('\\'), util.ETX)
        self.tag = 'tt'

    def handleMatch(self, m, data):
        if m.group(3):
            el = etree.Element(self.tag)
            el.text = util.AtomicString(util.code_escape(m.group(3).strip()))
            return el, m.start(0), m.end(0)
        else:
            return m.group(1).replace('\\\\', self.ESCAPED_BSLASH), m.start(0), m.end(0)

#our extension, replace original inline <code> with <tt>
class MyExtension(Extension):
   def extendMarkdown(self, md):
       # Insert code here to change markdown's behavior.
       BACKTICK_RE = r'(?:(?<!\\)((?:\\{2})+)(?=`{1,2})|(?<!\\)(`{1,2})(.+?)(?<!`)\2(?!`))'
       tt_tag = BacktickInlineProcessor(BACKTICK_RE)
       md.inlinePatterns.register(tt_tag, 'tt', 200)

#remove tags
def removeTags(text):
    allowed = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tt']
    kill = ['code', 'pre']

    cleaner = lxml.html.clean.Cleaner(kill_tags=kill)
    text = cleaner.clean_html(text)

    text = clean(text, tags=allowed, strip=True, strip_comments=True)

    return text

#preprocess markdown for task processing
def process(content):
    content = markdown.markdown(content,  extensions=[MyExtension(), 'fenced_code'])
    content = removeTags(content)
    content = re.sub(r'((?<=\n)(\n)(?=\n))', '', content)

    return content

#download readmes for all packages in the list of popular packages
#preprocess == True: saves a preprocessed version for task extraction as well
def getReadmes(preprocess):

    #load list into memory
    f = open(file_name) 
    data = json.load(f) 
    f.close()

    #create readme folder
    try:
        os.mkdir(readme_folder)
    except OSError:
        print("Cannot make folder " + readme_folder)

    if(preprocess):
            #create preprocess folder
            try:
                os.mkdir(html_folder)
            except OSError:
                print("Cannot make folder " + html_folder)
    for i in data: 
        name = i['name']
        
        #replicate and registry seem to be mising readmes for common packages
        registry = 'https://registry.npmjs.org/' 
        url = registry + urllib.parse.quote(name, safe='')
        try:
            response = urllib.request.urlopen(url)
            
        #if we fail, print error and continue
        except urllib.error.URLError as e:
            print("ERROR!") #inform in case we get multiple of these - lost connection?
            continue

        data2 = json.load(response)
        content = ''
        if 'readme' in data2:
            content = data2['readme']
        if content.strip() == '':
            # #use github instead
            github = i['repository_url']
            github = github.replace('github.com', 'raw.githubusercontent.com')

            #possible readme files to try
            readmes = ['readme.md', 'README.md', 'Readme.md', 'readme.markdown']

            for j in readmes:
                done = 1
                #try to get this url
                url = github + '/master/' + j
                try:
                    response = urllib.request.urlopen(url)
                #if we cant find, set done to 0
                except urllib.error.URLError as e2: 
                    if j == readmes[len(readmes)-1]:
                        print("ERROR!") #inform in case we get multiple of these - lost connection?
                        continue
                    done = 0
                #if we did find it, break from loop
                if done ==  1:
                    break
            #if never found, skip
            if(done == 0):
                continue
            content = response.read().decode('utf-8')

        #print final url
        print(name + ' ' + url)

        rm =  open(readme_folder + '/' + urllib.parse.quote(name, safe='@') + '.md', 'w', encoding='utf8')
        rm.write(content)
        rm.close()
        response.close()

        #process
        if(preprocess):
            content = process(content)
            rm =  open(html_folder + '/' + urllib.parse.quote(name, safe='@') + '.html', 'w', encoding='utf8')
            rm.write(content)
            rm.close()

#get list of n
getList(100)
#download readmes, true to make a copy processed for task extraction
getReadmes(True)