// Course enrollments are stored in Firestore (the backend has no enrollment
// endpoint). Each enrollment is one document keyed by `${courseUuid}_${userUuid}`
// so a startup can only enrol once per course, and counts are shared across
// all users — mirroring how Coursera tracks enrolled learners.
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { firestore } from "@/utils/firebase";

const COLLECTION = "courseEnrollments";

const enrollmentId = (courseUuid, userUuid) => `${courseUuid}_${userUuid}`;

// Enrol the current user (startup) in a course.
export const enrollInCourse = async ({ courseUuid, courseTitle, user }) => {
  if (!courseUuid || !user?.uuid) return false;
  try {
    await setDoc(
      doc(firestore, COLLECTION, enrollmentId(courseUuid, user.uuid)),
      {
        courseUuid,
        courseTitle: courseTitle || "",
        userUuid: user.uuid,
        userName: user.name || "",
        businessName: user.Business?.name || user.name || "",
        role: user.role || "",
        enrolledAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.log("enrollInCourse error", error);
    return false;
  }
};

export const unenrollFromCourse = async (courseUuid, userUuid) => {
  if (!courseUuid || !userUuid) return false;
  try {
    await deleteDoc(
      doc(firestore, COLLECTION, enrollmentId(courseUuid, userUuid)),
    );
    return true;
  } catch (error) {
    console.log("unenrollFromCourse error", error);
    return false;
  }
};

// Whether the given user is enrolled in a course.
export const isEnrolled = async (courseUuid, userUuid) => {
  if (!courseUuid || !userUuid) return false;
  try {
    const snap = await getDoc(
      doc(firestore, COLLECTION, enrollmentId(courseUuid, userUuid)),
    );
    return snap.exists();
  } catch (error) {
    console.log("isEnrolled error", error);
    return false;
  }
};

// Number of startups enrolled in a single course.
export const getCourseEnrollmentCount = async (courseUuid) => {
  if (!courseUuid) return 0;
  try {
    const q = query(
      collection(firestore, COLLECTION),
      where("courseUuid", "==", courseUuid),
    );
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (error) {
    console.log("getCourseEnrollmentCount error", error);
    return 0;
  }
};

// Enrollment counts for many courses at once → { [courseUuid]: count }.
export const getEnrollmentCounts = async (courseUuids = []) => {
  const counts = {};
  await Promise.all(
    courseUuids.map(async (courseUuid) => {
      counts[courseUuid] = await getCourseEnrollmentCount(courseUuid);
    }),
  );
  return counts;
};

// Set of course uuids the given user is enrolled in.
export const getMyEnrolledCourseUuids = async (userUuid) => {
  if (!userUuid) return new Set();
  try {
    const q = query(
      collection(firestore, COLLECTION),
      where("userUuid", "==", userUuid),
    );
    const snap = await getDocs(q);
    const ids = new Set();
    snap.forEach((d) => {
      const courseUuid = d.data()?.courseUuid;
      if (courseUuid) ids.add(courseUuid);
    });
    return ids;
  } catch (error) {
    console.log("getMyEnrolledCourseUuids error", error);
    return new Set();
  }
};

// Everyone enrolled in one course, newest first. Used by the staff view of a
// course to list who has signed up.
export const getCourseEnrollments = async (courseUuid) => {
  if (!courseUuid) return [];
  try {
    const q = query(
      collection(firestore, COLLECTION),
      where("courseUuid", "==", courseUuid),
    );
    const snap = await getDocs(q);
    const rows = [];
    snap.forEach((d) => {
      const data = d.data() || {};
      rows.push({
        id: d.id,
        userUuid: data.userUuid || "",
        userName: data.userName || "",
        businessName: data.businessName || "",
        role: data.role || "",
        // Firestore timestamps only become a Date once the write lands.
        enrolledAt: data.enrolledAt?.toDate ? data.enrolledAt.toDate() : null,
      });
    });
    return rows.sort(
      (a, b) => (b.enrolledAt?.getTime() || 0) - (a.enrolledAt?.getTime() || 0),
    );
  } catch (error) {
    console.log("getCourseEnrollments error", error);
    return [];
  }
};
