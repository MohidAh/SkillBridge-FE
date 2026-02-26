import { Injectable, inject } from '@angular/core';
import { AuthService, User } from '@core/authentication';
import { NgxPermissionsService, NgxRolesService } from 'ngx-permissions';
import { switchMap, tap } from 'rxjs';
import { UserRole } from '@shared/enums/userRole.enums';
import { Menu, MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class StartupService {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuService);
  private readonly permissonsService = inject(NgxPermissionsService);
  private readonly rolesService = inject(NgxRolesService);

  /**
   * Load the application only after get the menu or other essential informations
   * such as permissions and roles.
   */
  load() {
    return new Promise<void>((resolve, reject) => {
      this.menuService.setLoading(true);
      this.authService
        .change()
        .pipe(
          tap(user => this.setPermissions(user)),
          switchMap(() => this.authService.menu()),
          tap(menu => this.setMenu(menu))
        )
        .subscribe({
          next: () => {
            this.menuService.setLoading(false);
            resolve();
          },
          error: () => {
            this.menuService.setLoading(false);
            resolve();
          },
        });
    });
  }

  private setMenu(menu: Menu[]) {
    this.menuService.addNamespace(menu, 'menu');
    this.menuService.set(menu);
  }

  private setPermissions(user: User) {
    const basePermissions = ['canAdd', 'canDelete', 'canEdit', 'canRead'];
    const rolePermission = this.getRolePermission(user?.roleId);
    const permissions = rolePermission ? [...basePermissions, rolePermission] : basePermissions;

    this.permissonsService.loadPermissions(permissions);
    this.rolesService.flushRoles();
    this.rolesService.addRoles({ ADMIN: ['ADMIN'], USER: ['USER'] });

    // Tips: Alternatively you can add permissions with role at the same time.
    // this.rolesService.addRolesWithPermissions({ ADMIN: permissions });
  }

  private getRolePermission(roleId?: number) {
    if (roleId === UserRole.Admin) {
      return 'ADMIN';
    }

    if (roleId === UserRole.User) {
      return 'USER';
    }

    return undefined;
  }
}
