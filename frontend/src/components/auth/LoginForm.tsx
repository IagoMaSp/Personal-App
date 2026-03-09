import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const success = await login(username, password);

        if (!success) {
            setError('Credenciales incorrectas o problema de servidor.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-hk-dark text-hk-light transition-colors duration-300">
            <div className="w-full max-w-md p-8 bg-hk-darker border border-hk-border rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-serif tracking-wider mb-2">Dash</h1>
                    <p className="text-hk-light/50 text-sm">Ingresa a tu cuenta para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2 text-hk-light/80">Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-hk-bg border border-hk-border rounded-lg px-4 py-3 text-sm text-hk-light focus:outline-none focus:border-hk-accent focus:ring-1 focus:ring-hk-accent transition-all"
                            placeholder="Nombre de usuario"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-hk-light/80">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-hk-bg border border-hk-border rounded-lg px-4 py-3 text-sm text-hk-light focus:outline-none focus:border-hk-accent focus:ring-1 focus:ring-hk-accent transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-hk-accent hover:bg-hk-accent-hover text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
