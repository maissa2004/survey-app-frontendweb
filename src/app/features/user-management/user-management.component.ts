// src/app/features/user-management/user-management.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { AlertService } from '../../core/services/alert.service';

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  deletingId: number | null = null;

  // Formulaire création user - initialement caché
  showCreateForm = false;
  newUser = {
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin'
  };

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    console.log('🟢 1. ngOnInit appelé');
    this.loadUsers();
    console.log('🟢 2. loadUsers() lancé');
  }

  loadUsers(): void {
    console.log('🟢 3. loadUsers() exécuté');
    this.loading = true;
    
    this.http.get<User[]>('/api/auth/users').subscribe({
      next: (data) => {
        console.log('🟢 4. Données reçues:', data);
        console.log('🟢 5. Nombre:', data.length);
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
        this.cdr.detectChanges();
        console.log('🟢 6. loading = false, users mis à jour');
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Annuler et fermer le formulaire
  cancelCreateForm(): void {
    this.showCreateForm = false;
    this.newUser = { username: '', email: '', phone: '', password: '', role: 'admin' };
    this.error = null;
  }

  createUser(): void {
    if (!this.newUser.username || !this.newUser.password) {
      this.alertService.showWarning('Champs manquants', 'Nom d\'utilisateur et mot de passe requis');
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    
    const userData: any = {
      username: this.newUser.username,
      password: this.newUser.password,
      role: this.newUser.role
    };
    
    if (this.newUser.email && this.newUser.email.trim() !== '') {
      userData.email = this.newUser.email;
    }
    
    if (this.newUser.phone && this.newUser.phone.trim() !== '') {
      userData.phone = this.newUser.phone;
    }
    
    this.http.post('/api/auth/register', userData).subscribe({
      next: () => {
        this.alertService.showSuccess('Utilisateur créé', `L'utilisateur "${this.newUser.username}" a été créé avec succès.`);
        this.loadUsers();
        this.showCreateForm = false;
        this.newUser = { username: '', email: '', phone: '', password: '', role: 'admin' };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        if (err.error?.includes('phone')) {
          this.alertService.showError('Erreur', 'Ce numéro de téléphone est déjà utilisé par un autre compte');
        } else if (err.error?.includes('username')) {
          this.alertService.showError('Erreur', 'Ce nom d\'utilisateur est déjà pris');
        } else if (err.error?.includes('email')) {
          this.alertService.showError('Erreur', 'Cet email est déjà utilisé');
        } else {
          this.alertService.showError('Erreur', err.error || 'Erreur lors de la création');
        }
        this.loading = false;
      }
    });
  }

  // 🔥 SUPPRESSION CORRIGÉE - Supprimer la méthode deleteItem() qui était mal écrite
  // Et garder uniquement deleteUser()

  async deleteUser(id: number): Promise<void> {
    this.deletingId = id;
    
    const user = this.users.find(u => u.id === id);
    if (user?.username === 'admin') {
      this.alertService.showError('Suppression impossible', 'Impossible de supprimer le super administrateur');
      this.deletingId = null;
      return;
    }
    
    // Petit délai pour l'animation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Confirmation avant suppression
    const confirmed = await this.confirmService.show({
      title: 'Confirmation de suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user?.username}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      this.deletingId = null;
      this.alertService.showInfo('Annulé', 'La suppression a été annulée.');
      return;
    }
    
    this.http.delete(`/api/auth/users/${id}`).subscribe({
      next: () => {
        this.alertService.showSuccess(
          'Utilisateur supprimé', 
          `L'utilisateur "${user?.username}" a été supprimé avec succès.`
        );
        this.deletingId = null;
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.alertService.showError('Erreur', 'Une erreur est survenue lors de la suppression');
        this.deletingId = null;
      }
    });
  }

  getAdminCount(): number {
    return this.users.filter(u => u.role === 'admin').length;
  }

  getEnqueteurCount(): number {
    return this.users.filter(u => u.role === 'enqueteur').length;
  }

  getActiveCount(): number {
    return this.users.filter(u => u.isActive === true).length;
  }

  getRoleLabel(role: string): string {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'enqueteur': return 'Enquêteur';
      default: return role;
    }
  }

  getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'admin': return 'bg-primary';
      case 'enqueteur': return 'bg-secondary';
      default: return 'bg-light';
    }
  }
}