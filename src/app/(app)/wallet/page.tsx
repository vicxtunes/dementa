import { getBalance, listTransactions } from "@/lib/domain/tokens/queries";
import { TOKEN_REASON_LABELS } from "@/lib/config/tokens";
import { PageHeader } from "@/components/spark/primitives";

const REASON_ICON: Record<string, string> = {
  topic_mastered: "bi-mortarboard",
  duel_entry: "bi-controller",
  duel_refund: "bi-arrow-counterclockwise",
  duel_payout: "bi-trophy",
  group_quiz_entry: "bi-people",
  group_quiz_payout: "bi-trophy",
  challenge_prize: "bi-award",
  assessment_completed: "bi-file-earmark-check",
  streak_bonus: "bi-fire",
  teacher_grant: "bi-gift",
  
  
  
  
  
  unlock_purchase: "bi-unlock",
};

export default async function WalletPage() {
  const [balance, transactions] = await Promise.all([getBalance(), listTransactions()]);
  const earned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Tokens are earned by doing academic work and spent on duels and team quizzes."
      />

      <div className="row g-4">
        <div className="col-sm-4">
          <div className="card card-stat">
            <span className="stat-label">Balance</span>
            <div className="stat-value">{balance} 🪙</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card card-stat">
            <span className="stat-label">Earned (recent)</span>
            <div className="stat-value">+{earned}</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card card-stat">
            <span className="stat-label">Spent (recent)</span>
            <div className="stat-value">{spent}</div>
          </div>
        </div>

        <div className="col-12">
          <div className="table-card-custom">
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>When</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="table-user-cell">
                          <span
                            className="table-user-avatar d-flex align-items-center justify-content-center text-lime"
                            style={{ background: "var(--brand-forest-medium)" }}
                          >
                            <i className={`bi ${REASON_ICON[t.reason] ?? "bi-coin"}`} />
                          </span>
                          <div>
                            <div className="table-user-name">{TOKEN_REASON_LABELS[t.reason] ?? t.reason}</div>
                            {t.reference_id && <div className="table-user-sub">{t.reference_id}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="table-user-sub">
                        {new Date(t.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td
                        className="table-amount"
                        style={{ textAlign: "right", color: t.amount >= 0 ? "var(--sys-green)" : "var(--sys-red)" }}
                      >
                        {t.amount >= 0 ? "+" : ""}
                        {t.amount}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5 table-user-sub">
                        No transactions yet. Master a topic to earn your first tokens.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
