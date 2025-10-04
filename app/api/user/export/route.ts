import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeOptions = {
      userInfo: searchParams.get('userInfo') === 'true',
      workoutData: searchParams.get('workoutData') === 'true',
      nutritionData: searchParams.get('nutritionData') === 'true',
      weightData: searchParams.get('weightData') === 'true',
      scheduleData: searchParams.get('scheduleData') === 'true',
      preferences: searchParams.get('preferences') === 'true'
    }

    // If no options specified, include everything (backward compatibility)
    const hasAnyOption = Object.values(includeOptions).some(v => v)
    const defaultIncludeAll = !hasAnyOption

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        // Workout data
        ...(defaultIncludeAll || includeOptions.workoutData ? {
          workouts: true,
          workoutTemplates: {
            include: {
              exercises: {
                include: {
                  exercise: {
                    include: {
                      bodyParts: {
                        include: {
                          bodyPart: true
                        }
                      },
                      equipments: {
                        include: {
                          equipment: true
                        }
                      },
                      muscles: {
                        include: {
                          muscle: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          workoutSessions: {
            include: {
              exercises: {
                include: {
                  exercise: {
                    include: {
                      bodyParts: {
                        include: {
                          bodyPart: true
                        }
                      },
                      equipments: {
                        include: {
                          equipment: true
                        }
                      },
                      muscles: {
                        include: {
                          muscle: true
                        }
                      }
                    }
                  },
                  sets: true
                }
              },
              savedState: true
            }
          },
          exercises: {
            include: {
              bodyParts: {
                include: {
                  bodyPart: true
                }
              },
              equipments: {
                include: {
                  equipment: true
                }
              },
              muscles: {
                include: {
                  muscle: true
                }
              }
            }
          },
          savedWorkoutStates: true,
          completedDays: true
        } : {}),
        
        // Nutrition data
        ...(defaultIncludeAll || includeOptions.nutritionData ? {
          nutritionLogs: true,
          foods: true,
          meals: {
            include: {
              ingredients: {
                include: {
                  food: true
                }
              }
            }
          }
        } : {}),
        
        // Weight tracking
        ...(defaultIncludeAll || includeOptions.weightData ? {
          weightEntries: true
        } : {}),
        
        // Schedule data
        ...(defaultIncludeAll || includeOptions.scheduleData ? {
          schedules: {
            include: {
              items: true
            }
          },
          scheduleTemplates: {
            include: {
              items: true
            }
          }
        } : {}),
        
        // Preferences
        ...(defaultIncludeAll || includeOptions.preferences ? {
          preferences: true
        } : {}),
        
        // Push notifications (always include if userInfo is selected)
        ...(defaultIncludeAll || includeOptions.userInfo ? {
          pushSubscriptions: true
        } : {})
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove sensitive data
    // Note: password is not selected in the query

    // Create a copy of user data and conditionally remove sections
    const userData = { ...user }

    // If not including workout data, remove workout-related fields
    if (!defaultIncludeAll && !includeOptions.workoutData) {
      delete (userData as any).workouts
      delete (userData as any).workoutTemplates
      delete (userData as any).workoutSessions
      delete (userData as any).exercises
      delete (userData as any).savedWorkoutStates
      delete (userData as any).completedDays
    }

    // If not including nutrition data, remove nutrition-related fields
    if (!defaultIncludeAll && !includeOptions.nutritionData) {
      delete (userData as any).nutritionLogs
      delete (userData as any).foods
      delete (userData as any).meals
    }

    // If not including weight data, remove weight entries
    if (!defaultIncludeAll && !includeOptions.weightData) {
      delete (userData as any).weightEntries
    }

    // If not including schedule data, remove schedules
    if (!defaultIncludeAll && !includeOptions.scheduleData) {
      delete (userData as any).schedules
      delete (userData as any).scheduleTemplates
    }

    // If not including preferences, remove preferences
    if (!defaultIncludeAll && !includeOptions.preferences) {
      delete (userData as any).preferences
    }

    // If not including user info, only keep basic info
    if (!defaultIncludeAll && !includeOptions.userInfo) {
      // Keep only basic user fields, remove all related data
      const basicFields = ['id', 'name', 'email', 'image', 'createdAt', 'updatedAt']
      Object.keys(userData).forEach(key => {
        if (!basicFields.includes(key)) {
          delete (userData as any)[key]
        }
      })
    }

    const exportData = {
      user: userData,
      exportDate: new Date().toISOString(),
      version: "1.0",
      exportedData: {
        userInfo: includeOptions.userInfo || defaultIncludeAll,
        workoutData: includeOptions.workoutData || defaultIncludeAll,
        nutritionData: includeOptions.nutritionData || defaultIncludeAll,
        weightData: includeOptions.weightData || defaultIncludeAll,
        scheduleData: includeOptions.scheduleData || defaultIncludeAll,
        preferences: includeOptions.preferences || defaultIncludeAll
      }
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="fitness-data-export.json"'
      }
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
