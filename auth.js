const supabaseUrl = 'https://hvsilwppchtpaghqhzcy.supabase.co';

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c2lsd3BwY2h0cGFnaHFoemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5ODI3MDcsImV4cCI6MjA5NDU1ODcwN30.iVREIgMlleFcyRVRQZiet8Xmvzr-nKXTha4UgiFlzV4';

const client = supabase.createClient(supabaseUrl, supabaseKey);

async function loginWithDiscord() {
    const { error } = await client.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        console.error(error);
        alert('Discord giriş hatası!');
    }
}

async function checkLogin() {
    const { data } = await client.auth.getSession();

    const loginGate = document.getElementById('login-gate');

    if (data.session) {
        const discordUser = data.session.user;

        const { data: profile, error: profileError } = await client
            .from('profiles')
            .select('username, role')
            .eq('id', discordUser.id)
            .single();

        if (profileError) {
            console.warn('Profil okunamadı:', profileError.message);
        }

        localStorage.setItem('asthenya_session', JSON.stringify({
            username:
                profile?.username ||
                discordUser.user_metadata.full_name ||
                discordUser.user_metadata.name ||
                discordUser.email ||
                'Discord Kullanıcısı',

            role: profile?.role || 'user',

            loginTime: new Date().getTime(),

            provider: 'discord'
        }));

        localStorage.setItem('asthenya_logged_in', 'true');

        if (loginGate) {
            loginGate.style.display = 'none';
        }

        document.body.style.overflow = 'auto';

        console.log('Discord login başarılı:', profile?.role || 'user');

        return true;

    } else {
        if (loginGate) {
            loginGate.style.display = 'flex';
        }

        localStorage.removeItem('asthenya_session');
        localStorage.removeItem('asthenya_logged_in');

        return false;
    }
}

async function logout() {
    await client.auth.signOut();

    localStorage.removeItem('asthenya_session');
    localStorage.removeItem('asthenya_logged_in');

    window.location.reload();
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkLogin();

    client.auth.onAuthStateChange(async () => {
        await checkLogin();
    });
});
