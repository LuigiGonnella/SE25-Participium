import {defaultSession, ParticipiumContext} from "./models";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080/api/v1';

function fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${process.env.BOT_BEARER}`,
    };

    return fetch(url, { ...options, headers });
}

export async function verifyUser(username: string, code: string): Promise<boolean> {
    try {
        const response = await fetchWithAuth(`${BACKEND_URL}/auth/verifyTelegramUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, code }),
        });


        if (!response.ok) {
            const data = await response.json();
            console.error(`Error verifying user: ${data.message}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`Network error: ${error}`);
        return false;
    }
}

export async function checkUserVerification(ctx: ParticipiumContext): Promise<{verified: boolean, status: number}> {
    try {
        ctx.session ??= defaultSession;
        ctx.session.isVerified = false;
        const username = ctx.message?.from.username || ctx.from?.username;
        if (!username) {
            await ctx.reply("❌ You need a Telegram username to use the bot and verify your account. Please set one in your Telegram settings and try again.");
            return {verified: false, status: 0};
        }

        const response = await fetchWithAuth(`${BACKEND_URL}/citizens/telegram/${encodeURIComponent(username)}`, {
            method: 'GET',
        });

        if (!response.ok) {
            ctx.session.isVerified = false;
            const data = await response.json();
            console.error(`Error checking verification: ${data.message}`);
            return {verified: false, status: response.status};
        } else {
            ctx.session.isVerified = true;
            return {verified: true, status: response.status};
        }
    } catch (error) {
        console.error(`Network error: ${error}`);
        return {verified: false, status: 500};
    }
}

export async function verifyUserMiddleware(ctx: ParticipiumContext, next: () => Promise<void>): Promise<unknown | void> {
    try {
        console.log(ctx.session);
        ctx.session ??= defaultSession;
        ctx.session.isVerified = false;
        const username = ctx.message?.from.username || ctx.from?.username;
        if (!username) {
            return ctx.reply("❌ You need a Telegram username to verify your account. Please set one in your Telegram settings and try again.");
        }
        const response = await checkUserVerification(ctx);
        if (response.status === 404) {
            return ctx.reply("❌ Your Telegram account is not linked to any Participium account. Please add your Telegram username in your Participium profile and try again.");
        } else if (!response.verified) {
            if(response.status)
                return ctx.reply("❌ An error occurred while checking your verification status. Please try again later.");
            return;
        }
        await next();
    } catch (error) {
        console.error(`Network error: ${error}`);
        return ctx.reply("❌ A network error occurred. Please try again later.");
    }
}

export async function submitReport(ctx: ParticipiumContext): Promise<string> {
    const form = new FormData();

    form.append("userId", ctx.message.from.username.toString());
    form.append("title", ctx.session.title);
    form.append("description", ctx.session.description);
    form.append("latitude", ctx.session.latitude.toString());
    form.append("longitude", ctx.session.longitude.toString());
    form.append("category", ctx.session.category);
    form.append("anonymous", ctx.session.anonymous ? "true" : "false");

    try {
        for (let i = 0; i < ctx.session.photos.length; i++) {
            const fileId = ctx.session.photos[i];

            const blob = await downloadTelegramFile(fileId);

            form.append(
                "photos",
                blob,
                `photo_${i + 1}.jpg`
            );
        }

        const response = await fetchWithAuth(`${BACKEND_URL}/reports/telegram`, {
            method: 'POST',
            body: form
        });

        if (!response.ok) {
            console.log(response);
            const data = await response.json();
            console.error(`Error submitting report: ${data.message}`);
            return "❌ There was an error submitting the report.";
        }

        const report = await response.json();

        ctx.session = defaultSession;
        return `✅ Your report has been created with id #${report.id}! Thank you.`;
    } catch (err) {
        console.error(err);
        return "❌ There was an error submitting the report.";
    }
}

export async function downloadTelegramFile(fileId: string): Promise<Blob> {
    // Step 1: Get file path
    const fileResp = await fetch(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${fileId}`
    );

    const fileData = await fileResp.json();
    console.log(fileData);
    if (!fileData.ok) throw new Error("Failed to retrieve file info");

    const filePath = fileData.result.file_path;

    // Step 2: Download actual file binary
    const fileDownload = await fetch(
        `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`,
    );

    const blob = await fileDownload.blob();

    return new Blob([blob], { type: 'image/jpg' });
}