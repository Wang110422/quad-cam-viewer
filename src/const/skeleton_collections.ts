// Kết nối các keypoint cho skeleton (theo chuẩn COCO 17 keypoints của YOLO Pose)
// 0: nose, 1: leye, 2: reye, 3: lear, 4: rear,
// 5: lshoulder, 6: rshoulder, 7: lelbow, 8: relbow,
// 9: lwrist, 10: rwrist, 11: lhip, 12: rhip,
// 13: lknee, 14: rknee, 15: lankle, 16: rankle
const SKELETON_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

export default SKELETON_CONNECTIONS;
