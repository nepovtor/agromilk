import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { AuthProvider } from "@/context/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

const InstructionsPage = lazy(() =>
  import("@/pages/InstructionsPage").then((m) => ({ default: m.InstructionsPage })),
);
const InstructionPage = lazy(() =>
  import("@/pages/InstructionPage").then((m) => ({ default: m.InstructionPage })),
);
const LoginPage = lazy(() =>
  import("@/pages/admin/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ApplicationsPage = lazy(() =>
  import("@/pages/admin/ApplicationsPage").then((m) => ({ default: m.ApplicationsPage })),
);
const ArticlesPage = lazy(() =>
  import("@/pages/admin/ArticlesPage").then((m) => ({ default: m.ArticlesPage })),
);
const ProductsPage = lazy(() =>
  import("@/pages/admin/ProductsPage").then((m) => ({ default: m.ProductsPage })),
);
const ArticleEditorPage = lazy(() =>
  import("@/pages/admin/ArticleEditorPage").then((m) => ({ default: m.ArticleEditorPage })),
);
const PrivacyPage = lazy(() =>
  import("@/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })),
);

function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Загрузка…</div>
  );
}
function Private({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function Routes() {
  useAnalytics();
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/instructions" component={InstructionsPage} />
        <Route path="/instructions/:slug" component={InstructionPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/admin/login" component={LoginPage} />
        <Route path="/admin">
          <Private>
            <DashboardPage />
          </Private>
        </Route>
        <Route path="/admin/applications">
          <Private>
            <ApplicationsPage />
          </Private>
        </Route>
        <Route path="/admin/applications/:id">
          <Private>
            <ApplicationsPage />
          </Private>
        </Route>
        <Route path="/admin/products">
          <Private>
            <ProductsPage />
          </Private>
        </Route>
        <Route path="/admin/instructions/new">
          <Private>
            <ArticleEditorPage />
          </Private>
        </Route>
        <Route path="/admin/instructions/:id/edit">
          <Private>
            <ArticleEditorPage />
          </Private>
        </Route>
        <Route path="/admin/instructions">
          <Private>
            <ArticlesPage />
          </Private>
        </Route>
        <Route path="/admin/articles/new">
          <Private>
            <ArticleEditorPage />
          </Private>
        </Route>
        <Route path="/admin/articles/:id/edit">
          <Private>
            <ArticleEditorPage />
          </Private>
        </Route>
        <Route path="/admin/articles">
          <Private>
            <ArticlesPage />
          </Private>
        </Route>
        <Route component={NotFoundPage} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
