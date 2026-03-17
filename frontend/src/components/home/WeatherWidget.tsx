import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, MapPin } from 'lucide-react';

interface WeatherData {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
}

const WMO_CODES: Record<number, { label: string, Icon: React.FC<{ className?: string }> }> = {
    0: { label: 'Despejado', Icon: Sun },
    1: { label: 'Mayormente despejado', Icon: Sun },
    2: { label: 'Parcialmente nublado', Icon: Cloud },
    3: { label: 'Nublado', Icon: Cloud },
    45: { label: 'Niebla', Icon: Cloud },
    48: { label: 'Niebla escarcha', Icon: Cloud },
    51: { label: 'Llovizna ligera', Icon: CloudRain },
    53: { label: 'Llovizna', Icon: CloudRain },
    55: { label: 'Llovizna densa', Icon: CloudRain },
    61: { label: 'Lluvia leve', Icon: CloudRain },
    63: { label: 'Lluvia moderada', Icon: CloudRain },
    65: { label: 'Lluvia fuerte', Icon: CloudRain },
    71: { label: 'Nieve leve', Icon: Snowflake },
    73: { label: 'Nieve moderada', Icon: Snowflake },
    75: { label: 'Nieve fuerte', Icon: Snowflake },
    95: { label: 'Tormenta', Icon: CloudLightning },
    96: { label: 'Tormenta con granizo', Icon: CloudLightning },
    99: { label: 'Tormenta fuerte', Icon: CloudLightning },
};

export const WeatherWidget = () => {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [locationName, setLocationName] = useState('Madrid'); // Default fallback

    useEffect(() => {
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.current_weather);
                }
            } catch (error) {
                console.error("Error fetching weather:", error);
            } finally {
                setLoading(false);
            }
        };

        const cachedLat = localStorage.getItem('hk-lat');
        const cachedLon = localStorage.getItem('hk-lon');

        if (cachedLat && cachedLon) {
            setLocationName('Tu Ubicación');
            fetchWeather(parseFloat(cachedLat), parseFloat(cachedLon));
        } else {
            // Try to get geolocation if possible, else fallback to Madrid
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        localStorage.setItem('hk-lat', latitude.toString());
                        localStorage.setItem('hk-lon', longitude.toString());
                        setLocationName('Tu Ubicación');
                        fetchWeather(latitude, longitude);
                    },
                    (error) => {
                        console.log("Geolocation denied or error, using fallback. Error:", error);
                        // Fallback Madrid
                        fetchWeather(40.4165, -3.7026);
                    }
                );
            } else {
                fetchWeather(40.4165, -3.7026);
            }
        }
    }, []);

    if (loading) {
        return (
            <div className="home-card flex items-center justify-center p-6 h-32">
                <div className="flex flex-col items-center gap-2 text-hk-text-muted/50">
                    <Sun className="w-6 h-6 animate-spin-slow" />
                    <span className="text-xs tracking-widest uppercase">Cargando clima...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const weatherInfo = WMO_CODES[data.weathercode] || { label: 'Desconocido', Icon: Cloud };
    const Icon = weatherInfo.Icon;

    return (
        <div className="home-card relative overflow-hidden group">
            {/* Background glow decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-32 h-32 -mt-12 -mr-12" />
            </div>

            <div className="home-card-header !pb-2">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-hk-accent" />
                    <h3 className="text-xs uppercase tracking-widest font-bold text-hk-text-muted">
                        {locationName}
                    </h3>
                </div>
            </div>

            <div className="flex items-end justify-between relative z-10 px-1 pb-1">
                <div className="flex items-center gap-4 border-r border-white/5 pr-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                        <Icon className="w-8 h-8 text-hk-accent drop-shadow-[0_0_8px_rgba(107,142,165,0.4)]" />
                    </div>
                    <div>
                        <div className="text-3xl font-light font-serif tracking-tight text-white mb-0.5">
                            {Math.round(data.temperature)}°<span className="text-hk-text-muted/50 text-xl">C</span>
                        </div>
                        <div className="text-xs text-hk-accent/80 font-medium">
                            {weatherInfo.label}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 pl-2">
                    <div className="flex items-center gap-1.5 text-xs text-hk-text-muted/80">
                        <Wind className="w-3.5 h-3.5 opacity-60" />
                        <span>{data.windspeed} km/h</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
