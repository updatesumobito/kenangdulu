"""Call the authorized Cloudflare MCP using Codex's local OAuth transport.

Usage: python scripts/cloudflare-mcp.py actions.json
Use the JSON string "tools" to inspect tool schemas. No model turns are started.
Raw results are saved under ignored .data/; credential fields are redacted in stdout.
"""
import json
from pathlib import Path
import queue
import shutil
import subprocess
import sys
import threading


def redact(value):
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, dict):
        return {key: '[REDACTED]' if key.lower() in {'token', 'value', 'secret', 'secretaccesskey', 'accesskeyid', 'access_key_id', 'secret_access_key', 'api_token', 'authorization'} else redact(item) for key, item in value.items()}
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return json.dumps(redact(parsed))
        except (ValueError, TypeError):
            return value
    return value


def main():
    actions = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
    command = shutil.which('codex.cmd') or shutil.which('codex')
    if not command:
        raise RuntimeError('Codex CLI is not installed')
    process = subprocess.Popen([command, 'app-server', '-c', 'mcp_servers.supabase.enabled=false'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, encoding='utf-8', creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    inbox = queue.Queue()

    def read():
        for line in process.stdout:
            try:
                inbox.put(json.loads(line))
            except ValueError:
                pass
        inbox.put({'transportClosed': True})

    threading.Thread(target=read, daemon=True).start()
    sequence = 0

    def send(message):
        process.stdin.write(json.dumps(message) + '\n')
        process.stdin.flush()

    def request(method, params):
        nonlocal sequence
        sequence += 1
        request_id = sequence
        send({'jsonrpc': '2.0', 'id': request_id, 'method': method, 'params': params})
        while True:
            message = inbox.get(timeout=120)
            if message.get('transportClosed'):
                raise RuntimeError('Codex transport closed')
            if message.get('id') == request_id and ('result' in message or 'error' in message):
                if 'error' in message:
                    raise RuntimeError(json.dumps(redact(message['error'])))
                return message['result']
            if 'id' in message and 'method' in message:
                send({'jsonrpc': '2.0', 'id': message['id'], 'error': {'code': -32601, 'message': 'Interactive request requires user review'}})

    try:
        request('initialize', {'clientInfo': {'name': 'kenang-r2-operator', 'version': '1.0.0'}, 'capabilities': {'experimentalApi': True}})
        send({'jsonrpc': '2.0', 'method': 'initialized'})
        thread = request('thread/start', {'cwd': str(Path.cwd()), 'ephemeral': True, 'approvalPolicy': 'never'})
        thread_id = thread['thread']['id']
        if actions == 'tools':
            print(json.dumps(request('mcpServerStatus/list', {'serverName': 'cloudflare', 'threadId': thread_id})))
            return
        if isinstance(actions, dict):
            actions = [actions]
        results = []
        for action in actions:
            private = action.get('_private', False)
            result = request('mcpServer/tool/call', {'threadId': thread_id, 'server': 'cloudflare', 'tool': action['tool'], 'arguments': action.get('arguments', {})})
            results.append({'tool': action['tool'], 'result': result})
            directory = Path('.data')
            directory.mkdir(exist_ok=True)
            (directory / 'cloudflare-mcp-result.json').write_text(json.dumps(results), encoding='utf-8')
            print(json.dumps({'privateResultSaved': True, 'tool': action['tool'], 'isError': result.get('isError', False)} if private else redact(results[-1])), flush=True)
            if result.get('isError'):
                raise RuntimeError('Cloudflare MCP reported an error; subsequent actions stopped')
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == '__main__':
    main()
