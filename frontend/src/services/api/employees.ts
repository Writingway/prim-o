import { Employee, ReceivedToken, SpentToken, Paginated } from "../../types/types";
import { authRequest } from "./client";

// Employees of the logged-in manager's company.
export const listEmployees = () =>
  authRequest<{ employees: Employee[] }>('GET', '/employees/list');

// Soft delete of an employee of the manager's company.
export const deleteEmployee = (employeeId: string) =>
  authRequest('DELETE', `/employees/${employeeId}`);

// Approves a pending employee (logged-in manager).
export const approveEmployee = (employeeId: string) =>
  authRequest('PATCH', `/employees/${employeeId}/approve`);

export const getEmployeeBalance = () =>
  authRequest<{ balance: number }>('GET', '/employees/me');

export const getEmployeeReceived = (page = 1, limit = 10) =>
  authRequest<Paginated<ReceivedToken>>('GET', `/employees/me/received?page=${page}&limit=${limit}`);

export const getEmployeeSpent = (page = 1, limit = 10) =>
  authRequest<Paginated<SpentToken>>('GET', `/employees/me/spent?page=${page}&limit=${limit}`);

// Manual "used" toggle on one of my codes (green = available, red = used).
export const setSpentUsed = (id: string, used: boolean) =>
  authRequest<{ id: string; used: boolean }>('PATCH', `/employees/me/spent/${id}`, { used });
