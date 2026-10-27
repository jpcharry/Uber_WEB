"""Servidor de demostración LOCAL. Ejecución: python servidor_demo.py
Front-end en http://127.0.0.1:5500 -> /api -> API del profesor.
Solo desarrollo: no ejecutar en producción.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import build_opener, ProxyHandler, Request
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
import os, json

BACKEND = os.environ.get('API_PROFESOR_URL', 'http://20.20.1.157:8000/api').rstrip('/')
WEB = Path(__file__).resolve().parent / 'public'
OPENER = build_opener(ProxyHandler({}))  # No enviar direcciones privadas a proxy externo.

class WebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def _api(self):
        if not urlsplit(self.path).path.startswith('/api/'):
            return False
        length = int(self.headers.get('Content-Length') or 0)
        if length > 1024 * 1024:
            self.send_error(413, 'Payload demasiado grande')
            return True
        headers = {'Accept': 'application/json'}
        for key in ('Authorization', 'Content-Type'):
            if self.headers.get(key): headers[key] = self.headers[key]
        url = BACKEND + self.path[4:]
        body = self.rfile.read(length) if length else None
        try:
            req = Request(url, data=body, headers=headers, method=self.command)
            with OPENER.open(req, timeout=15) as response:
                status = response.status
                content = response.read()
                typ = response.headers.get('Content-Type', 'application/json')
        except HTTPError as e:
            status = e.code
            content = e.read()
            typ = e.headers.get('Content-Type', 'application/json')
        except (URLError, TimeoutError, OSError) as e:
            status=502
            typ='application/json'
            content = json.dumps({'success':False,'message':'No se pudo conectar al backend del profesor desde este equipo.'}).encode()
        self.send_response(status)
        self.send_header('Content-Type', typ)
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(content)
        return True

    def do_GET(self):
        if self._api(): return
        if urlsplit(self.path).path=='/': self.path='/index.html'
        return super().do_GET()

    def do_POST(self): self._api()
    def do_PUT(self): self._api()
    def do_PATCH(self): self._api()
    def do_DELETE(self): self._api()

if __name__ == '__main__':
    print(f'RUTA: http://127.0.0.1:5500')
    print(f'Backend: {BACKEND}')
    print('Ctrl+C para salir')
    ThreadingHTTPServer(('127.0.0.1', 5500), WebHandler).serve_forever()
