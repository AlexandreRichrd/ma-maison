import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("register", "routes/register.tsx"),
  route("activate", "routes/activate.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  layout("routes/_layout.tsx", [
    index("routes/dashboard.tsx"),
    route("shopping", "routes/shopping.tsx"),
    route("shopping/:listId", "routes/shopping.$listId.tsx"),
    route("recipes", "routes/recipes.tsx"),
    route("recipes/:recipeId", "routes/recipes.$recipeId.tsx"),
    route("cleaning", "routes/cleaning.tsx"),
    route("reminders", "routes/reminders.tsx"),
    route("household", "routes/household.tsx"),
    route("climate/:deviceName", "routes/climate.$deviceName.tsx"),
  ]),
] satisfies RouteConfig;
