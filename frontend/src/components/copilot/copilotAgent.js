/**
 * CustomerHub CRM - Lightweight Agentic Copilot Logic
 * 
 * Tool-based deterministic CRM Assistant that analyzes existing customer,
 * order, and follow-up datasets, generating contextual responses with
 * direct interactive actions (e.g. opening order/customer modal).
 * 
 * Note: Clearly labeled as rule-based CRM assistant (AI-ready when configured)
 * to avoid misleading live LLM claims.
 */

export async function processCopilotQuery({
  query,
  customers = [],
  orders = [],
  followUpTasks = [],
  actions: {
    openCustomerModal,
    openOrderModal,
    setActiveView,
  } = {}
}) {
  const text = (query || '').trim().toLowerCase();

  // Helper formatting
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amt || 0));
  };

  // Simulate short realistic thinking/processing delay for natural feel
  await new Promise((res) => setTimeout(res, 450));

  // --- INTENT 1: ORDERS NEEDING ATTENTION ---
  if (
    text.includes('order') && (
      text.includes('attention') ||
      text.includes('pending') ||
      text.includes('processing') ||
      text.includes('stuck') ||
      text.includes('unfulfilled') ||
      text.includes('delay') ||
      text.includes('which order') ||
      text.includes('status')
    ) ||
    text === 'which orders need attention?'
  ) {
    const attentionOrders = orders.filter((o) =>
      ['pending', 'processing', 'on-hold'].includes((o.status || '').toLowerCase())
    );

    if (attentionOrders.length === 0) {
      return {
        text: '✅ **All orders are fulfilled!** There are currently 0 pending or processing orders in your store records.',
        toolUsed: 'orders_scanner',
        actions: [
          {
            label: 'View All Orders',
            onClick: () => setActiveView?.('orders'),
          },
        ],
      };
    }

    const pendingTotal = attentionOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const orderLines = attentionOrders.map((o) => {
      const custName = `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Guest';
      const statusLabel = (o.status || 'pending').toUpperCase();
      return `• **Order #${o.id}** (${statusLabel}) — ${custName} — **${formatCurrency(o.total)}** (${o.line_items?.length || 1} item)`;
    });

    const actionButtons = attentionOrders.slice(0, 3).map((o) => ({
      label: `Inspect #${o.id}`,
      onClick: () => openOrderModal?.(o.id),
    }));

    if (setActiveView) {
      actionButtons.push({
        label: 'View in Orders Table',
        onClick: () => setActiveView('orders'),
      });
    }

    return {
      text: `⚠️ Found **${attentionOrders.length} orders needing attention** representing **${formatCurrency(pendingTotal)}** in unfulfilled value:\n\n${orderLines.join('\n')}\n\n*Recommended action: Verify tracking information or contact payment providers for pending transactions.*`,
      toolUsed: 'orders_scanner',
      actions: actionButtons,
    };
  }

  // --- INTENT 2: BEST / TOP CUSTOMERS ---
  if (
    text.includes('best customer') ||
    text.includes('top customer') ||
    text.includes('highest spend') ||
    text.includes('vip customer') ||
    text.includes('who are my best') ||
    text.includes('who spends the most') ||
    text.includes('valuable customer') ||
    text.includes('top buyer') ||
    text === 'who are my best customers?'
  ) {
    const sortedCustomers = [...customers].sort(
      (a, b) => parseFloat(b.total_spent || 0) - parseFloat(a.total_spent || 0)
    );

    const topCount = Math.min(4, sortedCustomers.length);
    const top = sortedCustomers.slice(0, topCount);

    if (top.length === 0) {
      return {
        text: 'No customer purchase records found yet in the current dataset.',
        toolUsed: 'customer_analytics',
        actions: [],
      };
    }

    const lines = top.map((c, idx) => {
      const tierMeta = c.meta_data?.find((m) => m.key === 'crm_tier')?.value || (c.is_paying_customer ? 'Paying Customer' : 'Standard');
      const company = c.billing?.company ? ` (${c.billing.company})` : '';
      return `${idx + 1}. **${c.first_name} ${c.last_name}**${company} — **${formatCurrency(c.total_spent)}** across ${c.orders_count || 0} orders • *${tierMeta}*`;
    });

    const actionButtons = top.slice(0, 3).map((c) => ({
      label: `Profile: ${c.first_name}`,
      onClick: () => openCustomerModal?.(c.id),
    }));

    if (setActiveView) {
      actionButtons.push({
        label: 'Customer Directory',
        onClick: () => setActiveView('customers'),
      });
    }

    return {
      text: `👑 Here are your **top ${topCount} highest-value customers** ranked by lifetime spend:\n\n${lines.join('\n')}\n\n*These accounts drive the bulk of your store revenue. Consider rewarding them with VIP loyalty perks or executive check-ins.*`,
      toolUsed: 'customer_analytics',
      actions: actionButtons,
    };
  }

  // --- INTENT 3: TODAY'S PRIORITIES / WHAT TO FOCUS ON ---
  if (
    text.includes('focus on today') ||
    text.includes('priorities') ||
    text.includes('what should i focus') ||
    text.includes('what to do') ||
    text.includes('tasks') ||
    text.includes('follow up') ||
    text.includes('urgent') ||
    text === 'what should i focus on today?'
  ) {
    const activeTasks = followUpTasks.filter((t) => t.status !== 'completed');

    if (activeTasks.length === 0) {
      return {
        text: '🎉 **All caught up!** You have 0 pending retention tasks. Your customer satisfaction and order tracking are fully up to date.',
        toolUsed: 'priorities_engine',
        actions: [
          {
            label: 'Open Follow-up Center',
            onClick: () => setActiveView?.('followups'),
          },
        ],
      };
    }

    const highPriority = activeTasks.filter((t) => t.priority === 'high');
    const displayTasks = activeTasks.slice(0, 4);

    const taskLines = displayTasks.map((t) => {
      const pBadge = t.priority === 'high' ? '🔴 HIGH' : '🟡 MEDIUM';
      return `• [${pBadge}] **${t.title}**\n  _${t.description}_ (Due: ${t.dueDate || 'Soon'})`;
    });

    const actions = [];
    if (displayTasks[0]?.customerId) {
      actions.push({
        label: `View ${displayTasks[0].customerName || 'Customer'}`,
        onClick: () => openCustomerModal?.(displayTasks[0].customerId),
      });
    }
    if (setActiveView) {
      actions.push({
        label: 'Manage All Tasks',
        onClick: () => setActiveView('followups'),
      });
    }

    return {
      text: `📋 You have **${activeTasks.length} pending follow-up items** (${highPriority.length} marked high priority) for today:\n\n${taskLines.join('\n\n')}\n\n*Resolving pending order fulfillment and VIP retention tasks directly boosts repeat purchase rates.*`,
      toolUsed: 'priorities_engine',
      actions,
    };
  }

  // --- INTENT 4: REVENUE & SALES SUMMARY ---
  if (
    text.includes('revenue') ||
    text.includes('sales') ||
    text.includes('financial') ||
    text.includes('how much money') ||
    text.includes('how are we doing')
  ) {
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const totalRev = completedOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const avgOrder = completedOrders.length > 0 ? totalRev / completedOrders.length : 0;
    const pendingOrders = orders.filter((o) => ['pending', 'processing'].includes((o.status || '').toLowerCase()));
    const pendingRev = pendingOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    return {
      text: `📊 **Store Financial Summary**:\n\n• **Settled Revenue**: **${formatCurrency(totalRev)}** (${completedOrders.length} completed transactions)\n• **Average Order Value**: **${formatCurrency(avgOrder)}**\n• **Pipeline / Pending Revenue**: **${formatCurrency(pendingRev)}** across ${pendingOrders.length} orders\n• **Total Indexed Orders**: **${orders.length} orders**`,
      toolUsed: 'financial_metrics',
      actions: [
        {
          label: 'View Dashboard Analytics',
          onClick: () => setActiveView?.('dashboard'),
        },
      ],
    };
  }

  // --- INTENT 5: SPECIFIC CUSTOMER SEARCH ---
  const customerNames = customers.map((c) => ({
    customer: c,
    firstName: (c.first_name || '').toLowerCase(),
    lastName: (c.last_name || '').toLowerCase(),
    fullName: `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase(),
  }));

  const matchedCustomer = customerNames.find(
    (cn) =>
      (cn.firstName && text.includes(cn.firstName)) ||
      (cn.lastName && text.includes(cn.lastName)) ||
      (cn.fullName && text.includes(cn.fullName))
  );

  if (matchedCustomer && (text.includes('customer') || text.includes('who is') || text.includes('about') || text.includes('find') || text.includes('lookup'))) {
    const c = matchedCustomer.customer;
    const tierMeta = c.meta_data?.find((m) => m.key === 'crm_tier')?.value || 'Standard';

    return {
      text: `👤 **Customer Profile: ${c.first_name} ${c.last_name}** (ID #${c.id})\n\n• **Email**: ${c.email}\n• **Phone**: ${c.billing?.phone || 'Not recorded'}\n• **Company**: ${c.billing?.company || 'Individual'}\n• **Lifetime Spend**: **${formatCurrency(c.total_spent)}** (${c.orders_count} orders)\n• **CRM Tier**: ${tierMeta}\n• **Location**: ${c.billing?.city || 'N/A'}, ${c.billing?.state || ''} ${c.billing?.country || ''}`,
      toolUsed: 'customer_lookup',
      actions: [
        {
          label: `Open ${c.first_name}'s Full Profile`,
          onClick: () => openCustomerModal?.(c.id),
        },
      ],
    };
  }

  // --- INTENT 6: HELP & CAPABILITIES ---
  if (text.includes('help') || text.includes('what can you do') || text.includes('commands') || text === 'hi' || text === 'hello') {
    return {
      text: `👋 **Hello! I'm CustomerHub Copilot.**\n\nI am your deterministic CRM Assistant connected directly to your store's customer database, order pipeline, and follow-up queues.\n\nYou can ask me:\n• *"Which orders need attention?"* — Flags pending/processing orders.\n• *"Who are my best customers?"* — Ranks highest lifetime value accounts.\n• *"What should I focus on today?"* — Summarizes active retention tasks.\n• *"How much revenue have we made?"* — Financial summary.\n• *"Tell me about [Customer Name]"* — Look up customer profiles.`,
      toolUsed: 'copilot_help',
      actions: [
        { label: 'Orders Needing Attention', onClick: () => null, prompt: 'Which orders need attention?' },
        { label: 'Best Customers', onClick: () => null, prompt: 'Who are my best customers?' },
        { label: 'Today\'s Priorities', onClick: () => null, prompt: 'What should I focus on today?' },
      ],
    };
  }

  // --- INTENT 7: FALLBACK WITH USEFUL GUIDANCE ---
  return {
    text: `🤔 I couldn't find a direct CRM rule match for "${query}".\n\nI am operating in **rule-based CRM tool mode** (transparent AI-ready assistant). I can immediately assist with:\n\n1. **Orders**: Inspecting pending, processing, or delayed transactions.\n2. **Customers**: Ranking top spenders or looking up contact details.\n3. **Follow-ups**: Highlighting priority retention tasks for today.\n4. **Revenue**: Calculating total settled sales and average order values.\n\nTry one of the quick suggestions below:`,
    toolUsed: 'copilot_fallback',
    actions: [
      { label: 'Which orders need attention?', onClick: () => null, prompt: 'Which orders need attention?' },
      { label: 'Who are my best customers?', onClick: () => null, prompt: 'Who are my best customers?' },
      { label: 'What should I focus on today?', onClick: () => null, prompt: 'What should I focus on today?' },
    ],
  };
}
