<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Routing\Controller;

/**
 * BFF: envia peticiones HTTP al backend suministrado por el profesor.
 * No accede a PostgreSQL, no autentica JWT y no almacena datos personales.
 */
class ProxyController extends Controller
{
    public function forward(Request $request, string $endpoint = '')
    {
        $base = rtrim((string) config('services.profesor_api_url'), '/');
        $path = ltrim($endpoint, '/');
        $url = $base . ($path !== '' ? '/' . $path : '');
        $query = $request->getQueryString();
        if ($query) $url .= '?' . $query;

        $headers = ['Accept' => 'application/json'];
        if ($request->bearerToken()) {
            $headers['Authorization'] = 'Bearer ' . $request->bearerToken();
        }
        if ($request->header('Content-Type')) {
            $headers['Content-Type'] = $request->header('Content-Type');
        }

        try {
            $upstream = Http::timeout(15)
                ->withOptions(['allow_redirects' => false])
                ->withHeaders($headers)
                ->send($request->method(), $url, [
                    'body' => $request->getContent(),
                ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'El servidor del profesor no responde. Verifica la red y que esté encendido.',
            ], 502);
        }

        // Se conserva status code y cuerpo JSON, sin filtrar cookies ni encabezados internos.
        return response($upstream->body(), $upstream->status())
            ->header('Content-Type', $upstream->header('Content-Type', 'application/json'));
    }
}
