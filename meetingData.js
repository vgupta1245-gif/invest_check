/**
 * Mock Data for Financial Meeting Detail View
 */
const MeetingData = {
    id: "mtg_2025_10_12",
    title: "Year-End Tax Strategy & Rebalancing",
    date: "Oct 12, 2025",
    time: "2:00 PM",
    duration: "45m",
    participants: [
        { name: "Sarah Jenkins", role: "Advisor", initials: "SJ", avatarColor: "#4f46e5" },
        { name: "David Miller", role: "Client", initials: "DM", avatarColor: "#10b981" }
    ],
    sentiment: "Cautiously Optimistic",
    summary: "Reviewed 2025 performance. Client is concerned about tech exposure. Agreed to harvest losses in emerging markets ETF to offset gains in semiconductor sector. Discussed increasing bond allocation by 5% for stability.",
    actionItems: [
        { id: 1, text: "Execute sell order for VWO (Vanguard Emerging Markets)", owner: "Advisor", status: "pending" },
        { id: 2, text: "Upload K-1 forms from real estate partnership", owner: "Client", status: "pending" },
        { id: 3, text: "Send updated fee schedule", owner: "Advisor", status: "completed" }
    ],
    financialContext: {
        assets: [
            { symbol: "NVDA", name: "NVIDIA Corp", change: "+2.4%", trend: "up" },
            { symbol: "VWO", name: "Vanguard EM ETF", change: "-0.8%", trend: "down" },
            { symbol: "MUB", name: "iShares National Muni Bond", change: "+0.1%", trend: "up" },
            { symbol: "SCHE", name: "Schwab Emerging Markets", change: "+0.2%", trend: "up" }
        ],
        concepts: [
            { term: "Wash-Sale Rule", definition: "IRS rule prohibiting claiming a loss on a sale if a substantially identical security is purchased within 30 days." },
            { term: "Tax-Loss Harvesting", definition: "Selling securities at a loss to offset a capital gains tax liability." }
        ]
    },
    transcript: [
        { time: "00:00", speaker: "Advisor", text: "Good afternoon! Thanks for hopping on. I wanted to dive right into the tax-loss harvesting opportunities we discussed via email." },
        { time: "00:15", speaker: "Client", text: "Hi Sarah. Yeah, I’ve been worried about the tax bill this year since we sold that rental property. I need to offset those gains." },
        { time: "00:28", speaker: "Advisor", text: "Exactly. Looking at your portfolio, your emerging markets position (VWO) is currently down about 8%. If we sell that now, we can capture about $4,000 in losses to offset the property sale. We can swap it for a similar ETF like SCHE to stay invested but avoid the wash-sale rule." },
        { time: "00:45", speaker: "Client", text: "That makes sense. What about the tech stocks? NVDA has been going crazy." },
        { time: "00:52", speaker: "Advisor", text: "It has. You're actually overweight there now—about 35% of your portfolio is in semis. I recommend trimming 5% of NVDA and moving that capital into municipal bonds (MUB) to dampen the volatility." },
        { time: "01:10", speaker: "Client", text: "I hate to sell winners, but I can't sleep with that much swing. Let's do it. When can we execute?" },
        { time: "01:18", speaker: "Advisor", text: "I can place the trades today. Also, did you get those K-1 forms I asked for?" },
        { time: "01:24", speaker: "Client", text: "Ah, forgot those. I'll upload them to the portal tonight." },
        { time: "01:30", speaker: "Advisor", text: "Perfect. Once I have those, I'll run the final projection." }
    ]
};
