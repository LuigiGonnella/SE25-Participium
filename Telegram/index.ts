import { session, Telegraf } from "telegraf";
import { ParticipiumContext, OfficeCategory } from "./models";
import * as dotenv from "dotenv";
import {verifyUserMiddleware, submitReport, verifyUser, checkUserVerification, isWithinTurin, getMyReports, getReportDetails} from "./API";
import { message } from "telegraf/filters";

dotenv.config();

if (process.env.BOT_TOKEN === undefined) {
    throw new TypeError("BOT_TOKEN must be provided!");
}
if (process.env.BOT_BEARER === undefined) {
    throw new TypeError("BOT_BEARER must be provided!");
}

type FlowStep = "location" | "title" | "description" | "category" | "photos" | "anonymous";

const MAX_PHOTOS = 3;
const BACK_HINT = "\n\n_Type `back` to return to the previous step._";
const BACK_COMMANDS = new Set(["back", "/back", "⬅️ back"]);
const DONE_COMMANDS = new Set(["done", "/done", "✅ done"]);
const stepHistoryStore = new Map<number, FlowStep[]>();

const bot = new Telegraf<ParticipiumContext>(process.env.BOT_TOKEN);
bot.use(session());

const getHistoryKey = (ctx: ParticipiumContext) => ctx.from?.id ?? ctx.chat?.id;
const replyMarkdown = (ctx: ParticipiumContext, text: string, extra = {}) =>
    ctx.reply(text, { parse_mode: "Markdown", ...extra });

const resetReportData = (ctx: ParticipiumContext) => {
    ctx.session.latitude = undefined;
    ctx.session.longitude = undefined;
    ctx.session.title = undefined;
    ctx.session.description = undefined;
    ctx.session.category = undefined;
    ctx.session.photos = [];
    ctx.session.anonymous = undefined;
    ctx.session.step = undefined;
};

const resetStepHistory = (ctx: ParticipiumContext) => {
    const key = getHistoryKey(ctx);
    if (key !== undefined) {
        stepHistoryStore.set(key, []);
    }
};

const rememberStep = (ctx: ParticipiumContext, step?: FlowStep) => {
    if (!step) return;
    const key = getHistoryKey(ctx);
    if (key === undefined) return;
    const history = stepHistoryStore.get(key) ?? [];
    history.push(step);
    stepHistoryStore.set(key, history);
};

const buildCategoryKeyboard = () => [
    ...Object.values(OfficeCategory).map((category) => [{ text: category.toString() }]),
    [{ text: "⬅️ Back" }],
];

const buildPhotosKeyboard = () => [
    [{ text: "✅ Done" }],
    [{ text: "⬅️ Back" }]
];

const buildAnonymousKeyboard = () => [
    [{ text: "Yes, anonymous" }],
    [{ text: "No, show my name" }],
    [{ text: "⬅️ Back" }],
];

const sendStepPrompt = (ctx: ParticipiumContext, step: FlowStep) => {

    switch (step) {
        case "location":
            return replyMarkdown(
                ctx,
                "🆕 *New report*\n\n*Step 1/6 — Location*\nSend the exact location of the issue using Telegram's *Location* attachment.",
                {
                    reply_markup: {
                        keyboard: [[{ text: "📍 Send Location", request_location: true }]],
                        one_time_keyboard: true,
                        resize_keyboard: true,
                    }
                }
            );
        case "title":
            return replyMarkdown(
                ctx,
                `✏️ *Step 2/6 — Title*\nWrite a concise title for the issue.`,
                {
                    reply_markup: {
                        keyboard: [[{ text: "⬅️ Back" }]],
                        one_time_keyboard: true,
                        resize_keyboard: true,
                    }
                }
            );
        case "description":
            return replyMarkdown(
                ctx,
                `📝 *Step 3/6 — Description*\nDescribe the issue with as many details as possible.`,
                {
                    reply_markup: {
                        keyboard: [[{ text: "⬅️ Back" }]],
                        one_time_keyboard: true,
                        resize_keyboard: true,
                    }
                }
            );
        case "category":
            return replyMarkdown(
                ctx,
                `📚 *Step 4/6 — Category*\nChoose the category that best matches the issue.`,
                {
                    reply_markup: {
                        keyboard: buildCategoryKeyboard(),
                        one_time_keyboard: true,
                        resize_keyboard: true,
                    },
                }
            );
        case "photos":
            return replyMarkdown(
                ctx,
                `📸 *Step 5/6 — Photos*\nSend between 1 and ${MAX_PHOTOS} photos.\nType \`done\` when you are finished.`,
                {
                    reply_markup: {
                        keyboard: buildPhotosKeyboard(),
                        one_time_keyboard: true,
                        resize_keyboard: true,
                    },
                }
            );
        case "anonymous":
            return replyMarkdown(
                ctx,
                `🥷 *Step 6/6 — Visibility*\nDo you want to stay anonymous in the report?`,
                {
                    reply_markup: {
                        keyboard: buildAnonymousKeyboard(),
                        one_time_keyboard: true,
                        resize_keyboard: true,
                    },
                }
            );
    }
};

const clearStepData = (ctx: ParticipiumContext, step: FlowStep) => {
    switch (step) {
        case "location":
            ctx.session.latitude = undefined;
            ctx.session.longitude = undefined;
            break;
        case "title":
            ctx.session.title = undefined;
            break;
        case "description":
            ctx.session.description = undefined;
            break;
        case "category":
            ctx.session.category = undefined;
            break;
        case "photos":
            ctx.session.photos = [];
            break;
        case "anonymous":
            ctx.session.anonymous = undefined;
            break;
    }
};

const goToStep = (
    ctx: ParticipiumContext,
    nextStep: FlowStep,
    options: { skipHistory?: boolean } = {}
) => {
    if (!options.skipHistory) {
        rememberStep(ctx, ctx.session.step as FlowStep | undefined);
    }
    ctx.session.step = nextStep;
    if (nextStep === "photos" && !ctx.session.photos) {
        ctx.session.photos = [];
    }
    return sendStepPrompt(ctx, nextStep);
};

const handleBackNavigation = (ctx: ParticipiumContext) => {
    if (!ctx.session.step) {
        return replyMarkdown(ctx, "⚠️ No active report. Use `/newreport` to start one.");
    }

    const key = getHistoryKey(ctx);
    if (key === undefined) {
        return replyMarkdown(ctx, "⚠️ Unable to go back right now. Please try again.");
    }

    const history = stepHistoryStore.get(key);
    if (!history || history.length === 0) {
        return replyMarkdown(ctx, "⚠️ You are already at the first step.");
    }

    clearStepData(ctx, ctx.session.step as FlowStep);
    const previousStep = history.pop();
    stepHistoryStore.set(key, history);
    ctx.session.step = previousStep;
    return sendStepPrompt(ctx, previousStep);
};

const normalizeText = (text: string) => text.trim().toLowerCase();
const isBackCommand = (text: string) => BACK_COMMANDS.has(text);
const isDoneCommand = (text: string) => DONE_COMMANDS.has(text);

bot.start(async (ctx) => {
    const identifier = ctx.update.message?.from.username ?? ctx.update.message?.from.first_name;
    console.log("Start command received by user:", identifier);

    await checkUserVerification(ctx);

    const firstName = ctx.from?.first_name ?? ctx.from?.username ?? "there";
    let reply = `👋 *Hello ${firstName}!*`;
    reply += ctx.session.isVerified
        ? "\n\n✅ You are verified! Use `/newreport` to submit an issue."
        : "\n\n🔐 Please verify your account with `/verify CODE` before submitting reports.";

    return replyMarkdown(ctx, reply, { reply_markup: { remove_keyboard: true } });
});

bot.command("verify", async (ctx) => {
    await checkUserVerification(ctx);

    if (ctx.session?.isVerified) {
        return replyMarkdown(ctx, "✅ *Your Telegram account is already linked.*", {
            reply_markup: { remove_keyboard: true },
        });
    }

    const rawText = ctx.message?.text ?? "";
    const parts = rawText.trim().split(/\s+/);
    if (parts.length !== 2) {
        return replyMarkdown(ctx, "ℹ️ Usage: `/verify CODE`\n\nGo to your Participium profile, add your Telegram username, and generate a verification code. Then, use the verify command with the code here to complete the verification process.", {
            reply_markup: { remove_keyboard: true },
        });
    }

    const code = parts[1];

    try {
        const verified = await verifyUser(ctx.message.from.username, code);

        if (verified) {
            ctx.session.isVerified = true;
            return replyMarkdown(ctx, "✅ *Your Telegram account is now linked!*", {
                reply_markup: { remove_keyboard: true },
            });
        }
        return replyMarkdown(ctx, "❌ Invalid or expired code.", {
            reply_markup: { remove_keyboard: true },
        });
    } catch (err) {
        console.error(err);
        return replyMarkdown(ctx, "❌ Verification failed. Please try again later.", {
            reply_markup: { remove_keyboard: true },
        });
    }
});

const helpText = `
🆘 *Help & Commands*

Here's what you can do with this bot:

/newreport  
Start a new report about an issue in the city (road damage, waste, lighting, etc.).

/verify CODE  
Link your Telegram account to your Participium profile so you can submit reports.

/status  
Check the status of your submitted reports.

/faq  
Read frequently asked questions.

/contact  
Get contact information for Municipality support.

ℹ️ Tip: You can type *back* at any time while creating a report to go to the previous step.`

const contactText = `📞 *Municipality Support*

If you need help beyond this bot, you can contact the Municipality:

📧 Email: support@participium.it  
📞 Phone: +39 011 123 4567  
🌐 Website: https://www.participium.it
`

const faqText = `❓ Frequently Asked Questions (FAQ)

1️⃣ What is Participium?
Participium is a civic platform that allows citizens to report issues in the city (such as damaged infrastructure, waste problems, or public safety concerns) directly to the Municipality in a structured and transparent way.

2️⃣ Who can submit a report?
Any registered citizen can submit a report. To submit reports through Telegram, your Telegram account must be linked to your Participium profile using the verification code.

3️⃣ How do I verify my Telegram account?
Go to your Participium profile on the website, add your Telegram username, generate a verification code, and then use:
/verify CODE
in this chat.

4️⃣ Can I submit a report anonymously?
Yes. During the report creation process, you can choose to submit the report anonymously. The Municipality will still receive the report, but your name will not be shown publicly.

5️⃣ What information is required to submit a report?
You will be guided step by step to provide:
- The exact location of the issue
- A short title
- A detailed description
- A category
- At least one photo
- Your visibility preference (anonymous or not)

6️⃣ How many photos can I upload?
You can upload up to 3 photos per report. At least one photo is required to continue.

7️⃣ The bot says my verification code is invalid.
Codes expire. Generate a new one from your Participium profile and try again.

8️⃣ What happens after I submit a report?
Your report is sent to the appropriate municipal office based on the selected category. You may receive updates or notifications as the report is processed.

9️⃣ Can I edit or cancel a report after submitting it?
Once a report is submitted, it cannot be edited or cancelled.

ℹ️ Need help?
Type /help to see available commands.
`

bot.command("help", async (ctx) => {
    return replyMarkdown(ctx, helpText, {
        reply_markup: { remove_keyboard: true },
    });
});

bot.command("contact", async (ctx) => {
    return replyMarkdown(ctx, contactText, {
        reply_markup: { remove_keyboard: true },
    });
});

bot.command("faq", async (ctx) => {
    return replyMarkdown(ctx, faqText, {
        reply_markup: { remove_keyboard: true },
    });
});

bot.command("newreport", verifyUserMiddleware, async (ctx) => {
    resetReportData(ctx);
    resetStepHistory(ctx);
    return goToStep(ctx, "location", { skipHistory: true });
});

bot.command("myreports", verifyUserMiddleware, async (ctx) => {
    const username = ctx.from?.username;
    if (!username) {
        return replyMarkdown(ctx, "❌ Unable to retrieve your username.");
    }

    console.log(`Fetching reports for Telegram username: ${username}`);

    try {
        const reports = await getMyReports(username);
        console.log(`Found ${reports.length} reports for ${username}`);

        if (reports.length === 0) {
            return replyMarkdown(ctx, "📋 You have not submitted any reports yet.", {
                reply_markup: { remove_keyboard: true },
            });
        }

        let message = `📋 *Your Reports* (${reports.length} total)\n\n`;

        reports.forEach((report: any, index: number) => {
            const statusEmoji = {
                'Pending': '⏳',
                'Assigned': '📌',
                'In Progress': '🔧',
                'Suspended': '⏸️',
                'Rejected': '❌',
                'Resolved': '✅'
            }[report.status] || '📄';

            message += `${index + 1}. *Report #${report.id}*\n`;
            message += `   ${statusEmoji} Status: *${escapeMarkdown(report.status)}*\n`;
            message += `   Title: ${escapeMarkdown(report.title)}\n`;
            message += `   Category: ${escapeMarkdown(report.category)}\n`;
            message += `   Date: ${escapeMarkdown(new Date(report.timestamp).toLocaleDateString())}\n`;
            if (report.assignedStaff) {
                message += `   👤 Assigned to: ${escapeMarkdown(report.assignedStaff)}\n`;
            }
            message += `\n`;
        });

        message += "_Use `/reportstatus <id>` to see details of a specific report._";

        return replyMarkdown(ctx, message, {
            reply_markup: { remove_keyboard: true },
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return replyMarkdown(ctx, "❌ An error occurred while fetching your reports. Please try again later.", {
            reply_markup: { remove_keyboard: true },
        });
    }
});

const escapeMarkdown = (text: string | undefined): string => {
    if (!text) return "";
    return text.replace(/[_*[\]`]/g, '\\$&');
};

bot.command("reportstatus", verifyUserMiddleware, async (ctx) => {
    const rawText = ctx.message.text.trim();
    const parts = rawText.split(/\s+/);
    if (parts.length !== 2) {
        return replyMarkdown(ctx, "ℹ️ *Usage:*\n`/reportstatus <ID>`\n\nExample: `/reportstatus 12`");
    }

    const reportIdStr = parts[1];
    const reportId = Number.parseInt(reportIdStr, 10);

    if (Number.isNaN(reportId)) {
        return replyMarkdown(ctx, "❌ Invalid Report ID. Please enter a valid number.");
    }

    try {
        const report = await getReportDetails(reportId);

        if (!report) {
            return replyMarkdown(ctx, `❌ Report *#${reportId}* not found.`);
        }
        const statusEmoji = {
            'Pending': '⏳',
            'Assigned': '📌',
            'In Progress': '🔧',
            'Suspended': '⏸️',
            'Rejected': '❌',
            'Resolved': '✅'
        }[report.status] || '📄';

        let message = `📄 *Report #${report.id} Details*\n` +
                      `━━━━━━━━━━━━━━━━━━━\n` +
                      `*Title:* ${escapeMarkdown(report.title)}\n` +
                      `*Category:* ${escapeMarkdown(report.category)}\n` +
                      `*Date:* ${new Date(report.timestamp || Date.now()).toLocaleDateString()}\n\n` +
                      `${statusEmoji} *Status:* ${escapeMarkdown(report.status)}\n`;

        if (report.assignedStaff) {
            message += `👤 *Assigned to:* ${escapeMarkdown(report.assignedStaff)}\n`;
        }

        if (report.comment) {
            message += `\n💬 *Staff Comment:*\n_${escapeMarkdown(report.comment)}_\n`;
        }
        
        message += `\n📝 *Description:*\n${escapeMarkdown(report.description)}`;

        return replyMarkdown(ctx, message);

    } catch (error) {
        console.error("Error in reportstatus command:", error);
        return replyMarkdown(ctx, "❌ An error occurred while retrieving the report status.");
    }
});

bot.on(message("location"), verifyUserMiddleware, async (ctx) => {
    if (ctx.session.step !== "location") return;

    ctx.session.latitude = ctx.message.location.latitude;
    ctx.session.longitude = ctx.message.location.longitude;

    if (!isWithinTurin(ctx.session.latitude, ctx.session.longitude)) {
        return replyMarkdown(
            ctx,
            "❗ The location you provided is outside the city limits of Turin. Please send a valid location within Turin."
        );
    }

    return goToStep(ctx, "title");
});

bot.on(message("text"), verifyUserMiddleware, async (ctx) => {
    const text = ctx.message.text.trim();
    const normalized = normalizeText(text);

    if (isBackCommand(normalized)) {
        return handleBackNavigation(ctx);
    }

    switch (ctx.session.step) {
        case "title":
            ctx.session.title = text;
            return goToStep(ctx, "description");

        case "description":
            ctx.session.description = text;
            return goToStep(ctx, "category");

        case "category":
            if (!Object.values(OfficeCategory).some((c) => c.toString() === text)) {
                return replyMarkdown(
                    ctx,
                    "❗ Invalid category. Please pick one from the list or type `back`.",
                    {
                        reply_markup: {
                            keyboard: buildCategoryKeyboard(),
                            one_time_keyboard: true,
                            resize_keyboard: true,
                        },
                    }
                );
            }
            ctx.session.category = text;
            return goToStep(ctx, "photos");

        case "photos":
            ctx.session.photos = ctx.session.photos ?? [];
            if (isDoneCommand(normalized)) {
                if (ctx.session.photos.length === 0) {
                    return replyMarkdown(
                        ctx,
                        "❗ Please send at least *1 photo* before continuing."
                    );
                }
                return goToStep(ctx, "anonymous");
            }
            return replyMarkdown(
                ctx,
                `📸 Please send a photo or type \`done\` when finished.${BACK_HINT}`
            );

        case "anonymous":
            if (normalized === "yes, anonymous") {
                ctx.session.anonymous = true;
            } else if (normalized === "no, show my name") {
                ctx.session.anonymous = false;
            } else {
                return replyMarkdown(
                    ctx,
                    "Please select one of the provided options or type `back`.",
                    {
                        reply_markup: {
                            keyboard: buildAnonymousKeyboard(),
                            one_time_keyboard: true,
                            resize_keyboard: true,
                        },
                    }
                );
            }

        {
            const message = await submitReport(ctx);
            await replyMarkdown(ctx, message, {
                reply_markup: { remove_keyboard: true },
            });
            resetStepHistory(ctx);
            resetReportData(ctx);
            return message;
        }

        default:
            return;
    }
});

bot.on(message("photo"), verifyUserMiddleware, async (ctx) => {
    if (ctx.session.step !== "photos") return;

    ctx.session.photos = ctx.session.photos ?? [];
    if (ctx.session.photos.length >= MAX_PHOTOS) {
        return replyMarkdown(
            ctx,
            `❗ Maximum ${MAX_PHOTOS} photos allowed.\nType \`done\` to continue.`
        );
    }

    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    ctx.session.photos.push(fileId);

    return replyMarkdown(
        ctx,
        `📸 Photo added (${ctx.session.photos.length}/${MAX_PHOTOS}).\nSend more or type \`done\`.`
    );
});

bot.launch(() => {
    console.log("Bot started");
});
