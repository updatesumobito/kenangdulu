"""Call the project-scoped MCP through Codex's authenticated local transport.

No model turns are started. OAuth credentials stay in Codex's credential store.
Usage: python scripts/supabase-mcp.py actions.json
actions.json: [{"tool":"list_tables","arguments":{"schemas":["public"]}}]
"""
import json
import os
from pathlib import Path
import queue
import shutil
import subprocess
import sys
import threading

SERVER = os.environ.get('SUPABASE_MCP_SERVER', 'supabase')
PROJECT = 'xpwhpeolndmprzmdkldm'

def main():
    actions = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
    if isinstance(actions, dict): actions = [actions]
    command = shutil.which('codex.cmd') or shutil.which('codex')
    if not command:
        raise RuntimeError('Codex CLI is not installed')
    process = subprocess.Popen(
        [command, 'app-server'],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        text=True, encoding='utf-8', creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    inbox = queue.Queue()
    def read():
        for line in process.stdout:
            try: inbox.put(json.loads(line))
            except ValueError: pass
        inbox.put({'transportClosed': True})
    threading.Thread(target=read, daemon=True).start()
    sequence = 0
    def send(message):
        process.stdin.write(json.dumps(message)+'\n')
        process.stdin.flush()
    def request(method, params):
        nonlocal sequence
        sequence += 1
        request_id = sequence
        send({'jsonrpc':'2.0','id':request_id,'method':method,'params':params})
        while True:
            message = inbox.get(timeout=120)
            if message.get('transportClosed'): raise RuntimeError('Codex transport closed')
            if message.get('id') == request_id and ('result' in message or 'error' in message):
                if 'error' in message: raise RuntimeError(json.dumps(message['error']))
                return message['result']
            if 'id' in message and 'method' in message:
                # Never approve additional elicitation or actions implicitly.
                send({'jsonrpc':'2.0','id':message['id'],'error':{'code':-32601,'message':'Interactive request requires user review'}})
    try:
        request('initialize', {'clientInfo':{'name':'komukuna-mcp-operator','version':'1.0.0'},'capabilities':{'experimentalApi':True}})
        send({'jsonrpc':'2.0','method':'initialized'})
        thread = request('thread/start', {'cwd':str(Path.cwd()),'ephemeral':True,'approvalPolicy':'never'})
        thread_id = thread['thread']['id']
        status = request('mcpServerStatus/list', {'serverName':SERVER,'threadId':thread_id})
        if actions == 'tools':
            print(json.dumps(status, ensure_ascii=False))
            return
        identity = request('mcpServer/tool/call', {'threadId':thread_id,'server':SERVER,'tool':'get_project_url','arguments':{}})
        if PROJECT not in json.dumps(identity):
            raise RuntimeError('MCP project identity does not match the authorized project')
        print(json.dumps({'verifiedProject':PROJECT}), flush=True)
        for action in actions:
            result = request('mcpServer/tool/call', {'threadId':thread_id,'server':SERVER,**action})
            print(json.dumps({'tool':action['tool'],'result':result},ensure_ascii=False), flush=True)
            if result.get('isError'): raise RuntimeError('MCP tool reported an error; stopped subsequent actions')
    finally:
        process.terminate()
        try: process.wait(timeout=10)
        except subprocess.TimeoutExpired: process.kill()

if __name__ == '__main__':
    main()
