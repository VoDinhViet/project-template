import type { PermissionInfo } from '../types/permission.type'

/** Gom danh mục quyền theo `groupName`, giữ thứ tự nhóm mà `api` trả về. */
export function groupPermissionInfos(
  permissionInfos: PermissionInfo[],
): Map<string, PermissionInfo[]> {
  const permissionInfosByGroupName = new Map<string, PermissionInfo[]>()
  for (const permissionInfo of permissionInfos) {
    const groupInfos = permissionInfosByGroupName.get(permissionInfo.groupName)
    if (groupInfos) {
      groupInfos.push(permissionInfo)
    } else {
      permissionInfosByGroupName.set(permissionInfo.groupName, [permissionInfo])
    }
  }
  return permissionInfosByGroupName
}
