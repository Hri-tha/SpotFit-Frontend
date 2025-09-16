import { AddProductComponent } from './components/admin/add-product/add-product';
import { LoginComponent } from './components/login/login';
import { ProductListComponent } from './components/product-list/product-list';
import { AdminGuard } from './guards/admin.guard';
import { Routes } from '@angular/router';
// Add your component and guard imports here

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AddProductComponent, canActivate: [AdminGuard] },
  // other admin routes...
];