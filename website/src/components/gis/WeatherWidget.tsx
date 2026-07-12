import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Thermometer, Droplets, Wind, CloudRain, Sprout, Loader2, CloudOff } from 'lucide-react'

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  precipProbToday: number | null
  et0Today: number | null
}

const cache = new Map<string, WeatherData>()

/**
 * Live agro-weather for a farm location, from the free Open-Meteo API
 * (no key). Shows temperature, humidity, wind, rain probability and FAO
 * reference evapotranspiration (ET0) — the figure irrigation planning needs.
 */
export default function WeatherWidget({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const { t } = useTranslation()
  const [data, setData] = useState<WeatherData | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
    if (cache.has(key)) {
      setData(cache.get(key)!)
      setState('ready')
      return
    }
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m' +
      '&daily=precipitation_probability_max,et0_fao_evapotranspiration&forecast_days=1&timezone=auto'
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        const d: WeatherData = {
          temperature: j.current?.temperature_2m,
          humidity: j.current?.relative_humidity_2m,
          windSpeed: j.current?.wind_speed_10m,
          precipProbToday: j.daily?.precipitation_probability_max?.[0] ?? null,
          et0Today: j.daily?.et0_fao_evapotranspiration?.[0] ?? null,
        }
        cache.set(key, d)
        setData(d)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [lat, lng])

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" style={{ minHeight: 96 }}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  if (state === 'error' || !data) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white p-5 text-xs text-neutral-dark/50 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-light/50">
        <CloudOff className="h-4 w-4" /> {t('weather.unavailable')}
      </div>
    )
  }

  const items = [
    { icon: Thermometer, value: `${Math.round(data.temperature)}°C`, label: t('weather.temperature') },
    { icon: Droplets, value: `${Math.round(data.humidity)}%`, label: t('weather.humidity') },
    { icon: Wind, value: `${Math.round(data.windSpeed)} km/h`, label: t('weather.wind') },
    ...(data.precipProbToday != null ? [{ icon: CloudRain, value: `${data.precipProbToday}%`, label: t('weather.rainChance') }] : []),
    ...(data.et0Today != null ? [{ icon: Sprout, value: `${data.et0Today.toFixed(1)} mm`, label: t('weather.et0') }] : []),
  ]

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="text-xs font-bold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-light/50">
        {t('weather.title')}{label ? ` — ${label}` : ''}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
        {items.map(({ icon: Icon, value, label: l }) => (
          <div key={l} className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary dark:text-secondary" />
            <div>
              <div className="text-sm font-black leading-none">{value}</div>
              <div className="mt-0.5 text-[10px] text-neutral-dark/50 dark:text-neutral-light/50">{l}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-neutral-dark/35 dark:text-neutral-light/35">Open-Meteo</div>
    </div>
  )
}
