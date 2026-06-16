import { Employee, ReceivedToken, SpentToken, Paginated } from "../../types/types";
import { authRequest } from "./client";

// Liste les employés de l'entreprise du manager connecté.
export const listEmployees = () =>
  authRequest<{ employees: Employee[] }>('GET', '/employees/list');

// Supprime (soft delete) un employé de l'entreprise du manager.
export const deleteEmployee = (employeeId: string) =>
  authRequest('DELETE', `/employees/${employeeId}`);

// Approuve un employé en attente (manager connecté).
export const approveEmployee = (employeeId: string) =>
  authRequest('PATCH', `/employees/${employeeId}/approve`);

// Solde de l'employé connecté.
export const getEmployeeBalance = () =>
  authRequest<{ balance: number }>('GET', '/employees/me');

// Historique paginé des tokens reçus.
export const getEmployeeReceived = (page = 1, limit = 10) =>
  authRequest<Paginated<ReceivedToken>>('GET', `/employees/me/received?page=${page}&limit=${limit}`);

// Historique paginé des dépenses.
export const getEmployeeSpent = (page = 1, limit = 10) =>
  authRequest<Paginated<SpentToken>>('GET', `/employees/me/spent?page=${page}&limit=${limit}`);
