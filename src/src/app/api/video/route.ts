import { proxyVideo } from '@/lib/video-proxy'

export async function GET(request: Request) {
  return proxyVideo(request, 'public')
}
