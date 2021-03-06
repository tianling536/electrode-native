#if swift(>=4.0)
@objcMembers public class ErnObject: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let name: String
    public let value: String?
    public let domain: String?
    public let path: String?
    public let uri: String?
    public let version: Double
    public let expiry: Int64?
    public let leftButton: NavBarButton?
    /**
     Right button properties
     */
    public let rightButtons: [NavBarButton]?
    /**
     specify if user is a guest
     */
    public let isGuestUser: Bool?
    /**
     specify merge type
     */
    public let mergeType: Int?
    public let stringArray: [String]?
    public let integerArray: [Int]?
    public let booleanArray: [Bool]?

    public init(name: String, value: String?, domain: String?, path: String?, uri: String?, version: Double, expiry: Int64?, leftButton: NavBarButton?, rightButtons: [NavBarButton]?, isGuestUser: Bool?, mergeType: Int?, stringArray: [String]?, integerArray: [Int]?, booleanArray: [Bool]?) {
        self.name = name
        self.value = value
        self.domain = domain
        self.path = path
        self.uri = uri
        self.version = version
        self.expiry = expiry
        self.leftButton = leftButton
        self.rightButtons = rightButtons
        self.isGuestUser = isGuestUser
        self.mergeType = mergeType
        self.stringArray = stringArray
        self.integerArray = integerArray
        self.booleanArray = booleanArray
        super.init()
    }

    public override init() {
        self.name = String()
        self.version = Double()
        self.value = nil
        self.domain = nil
        self.path = nil
        self.uri = nil
        self.expiry = nil
        self.leftButton = nil
        self.rightButtons = nil
        self.isGuestUser = nil
        self.mergeType = nil
        self.stringArray = nil
        self.integerArray = nil
        self.booleanArray = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if let name = dictionary["name"] as? String {
            self.name = name
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [name]")
            self.name = dictionary["name"] as! String
        }
        if let version = dictionary["version"] as? Double {
            self.version = version
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [version]")
            self.version = dictionary["version"] as! Double
        }

        if let value = dictionary["value"] as? String {
            self.value = value
        } else {
            self.value = nil
        }
        if let domain = dictionary["domain"] as? String {
            self.domain = domain
        } else {
            self.domain = nil
        }
        if let path = dictionary["path"] as? String {
            self.path = path
        } else {
            self.path = nil
        }
        if let uri = dictionary["uri"] as? String {
            self.uri = uri
        } else {
            self.uri = nil
        }
        if let expiry = dictionary["expiry"] as? Int64 {
            self.expiry = expiry
        } else {
            self.expiry = nil
        }
        if let leftButtonDict = dictionary["leftButton"] as? [AnyHashable: Any] {
            self.leftButton = NavBarButton(dictionary: leftButtonDict)
        } else {
            self.leftButton = nil
        }
        if let validRightButtons = try? NSObject.generateObject(data: dictionary["rightButtons"], classType: [Any].self, itemType: NavBarButton.self),
            let rightButtonsList = validRightButtons as? [NavBarButton] {
            self.rightButtons = rightButtonsList
        } else {
            self.rightButtons = nil
        }
        if let isGuestUser = dictionary["isGuestUser"] as? Bool {
            self.isGuestUser = isGuestUser
        } else {
            self.isGuestUser = nil
        }
        if let mergeType = dictionary["mergeType"] as? Int {
            self.mergeType = mergeType
        } else {
            self.mergeType = nil
        }
        if let validStringArray = try? NSObject.generateObject(data: dictionary["stringArray"], classType: [Any].self, itemType: String.self),
            let stringArrayList = validStringArray as? [String] {
            self.stringArray = stringArrayList
        } else {
            self.stringArray = nil
        }
        if let validIntegerArray = try? NSObject.generateObject(data: dictionary["integerArray"], classType: [Any].self, itemType: Int.self),
            let integerArrayList = validIntegerArray as? [Int] {
            self.integerArray = integerArrayList
        } else {
            self.integerArray = nil
        }
        if let validBooleanArray = try? NSObject.generateObject(data: dictionary["booleanArray"], classType: [Any].self, itemType: Bool.self),
            let booleanArrayList = validBooleanArray as? [Bool] {
            self.booleanArray = booleanArrayList
        } else {
            self.booleanArray = nil
        }

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [:] as [AnyHashable: Any]

        dict["name"] = self.name
        dict["version"] = self.version

        if let nonNullValue = self.value {
            dict["value"] = nonNullValue
        }
        if let nonNullDomain = self.domain {
            dict["domain"] = nonNullDomain
        }
        if let nonNullPath = self.path {
            dict["path"] = nonNullPath
        }
        if let nonNullUri = self.uri {
            dict["uri"] = nonNullUri
        }
        if let nonNullExpiry = self.expiry {
            dict["expiry"] = nonNullExpiry
        }
        if let nonNullLeftButton = self.leftButton {
            dict["leftButton"] = nonNullLeftButton.toDictionary()
        }
        if let nonNullRightButtons = self.rightButtons {
            dict["rightButtons"] = nonNullRightButtons.map { $0.toDictionary() }
        }
        if let nonNullIsGuestUser = self.isGuestUser {
            dict["isGuestUser"] = nonNullIsGuestUser
        }
        if let nonNullMergeType = self.mergeType {
            dict["mergeType"] = nonNullMergeType
        }
        if let nonNullStringArray = self.stringArray {
            dict["stringArray"] = nonNullStringArray
        }
        if let nonNullIntegerArray = self.integerArray {
            dict["integerArray"] = nonNullIntegerArray
        }
        if let nonNullBooleanArray = self.booleanArray {
            dict["booleanArray"] = nonNullBooleanArray
        }
        return dict as NSDictionary
    }
}

#else

public class ErnObject: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let name: String
    public let value: String?
    public let domain: String?
    public let path: String?
    public let uri: String?
    public let version: Double
    public let expiry: Int64?
    public let leftButton: NavBarButton?
    /**
     Right button properties
     */
    public let rightButtons: [NavBarButton]?
    /**
     specify if user is a guest
     */
    public let isGuestUser: Bool?
    /**
     specify merge type
     */
    public let mergeType: Int?
    public let stringArray: [String]?
    public let integerArray: [Int]?
    public let booleanArray: [Bool]?

    public init(name: String, value: String?, domain: String?, path: String?, uri: String?, version: Double, expiry: Int64?, leftButton: NavBarButton?, rightButtons: [NavBarButton]?, isGuestUser: Bool?, mergeType: Int?, stringArray: [String]?, integerArray: [Int]?, booleanArray: [Bool]?) {
        self.name = name
        self.value = value
        self.domain = domain
        self.path = path
        self.uri = uri
        self.version = version
        self.expiry = expiry
        self.leftButton = leftButton
        self.rightButtons = rightButtons
        self.isGuestUser = isGuestUser
        self.mergeType = mergeType
        self.stringArray = stringArray
        self.integerArray = integerArray
        self.booleanArray = booleanArray
        super.init()
    }

    public override init() {
        self.name = String()
        self.version = Double()
        self.value = nil
        self.domain = nil
        self.path = nil
        self.uri = nil
        self.expiry = nil
        self.leftButton = nil
        self.rightButtons = nil
        self.isGuestUser = nil
        self.mergeType = nil
        self.stringArray = nil
        self.integerArray = nil
        self.booleanArray = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if let name = dictionary["name"] as? String {
            self.name = name
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [name]")
            self.name = dictionary["name"] as! String
        }
        if let version = dictionary["version"] as? Double {
            self.version = version
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [version]")
            self.version = dictionary["version"] as! Double
        }

        if let value = dictionary["value"] as? String {
            self.value = value
        } else {
            self.value = nil
        }
        if let domain = dictionary["domain"] as? String {
            self.domain = domain
        } else {
            self.domain = nil
        }
        if let path = dictionary["path"] as? String {
            self.path = path
        } else {
            self.path = nil
        }
        if let uri = dictionary["uri"] as? String {
            self.uri = uri
        } else {
            self.uri = nil
        }
        if let expiry = dictionary["expiry"] as? Int64 {
            self.expiry = expiry
        } else {
            self.expiry = nil
        }
        if let leftButtonDict = dictionary["leftButton"] as? [AnyHashable: Any] {
            self.leftButton = NavBarButton(dictionary: leftButtonDict)
        } else {
            self.leftButton = nil
        }
        if let validRightButtons = try? NSObject.generateObject(data: dictionary["rightButtons"], classType: [Any].self, itemType: NavBarButton.self),
            let rightButtonsList = validRightButtons as? [NavBarButton] {
            self.rightButtons = rightButtonsList
        } else {
            self.rightButtons = nil
        }
        if let isGuestUser = dictionary["isGuestUser"] as? Bool {
            self.isGuestUser = isGuestUser
        } else {
            self.isGuestUser = nil
        }
        if let mergeType = dictionary["mergeType"] as? Int {
            self.mergeType = mergeType
        } else {
            self.mergeType = nil
        }
        if let validStringArray = try? NSObject.generateObject(data: dictionary["stringArray"], classType: [Any].self, itemType: String.self),
            let stringArrayList = validStringArray as? [String] {
            self.stringArray = stringArrayList
        } else {
            self.stringArray = nil
        }
        if let validIntegerArray = try? NSObject.generateObject(data: dictionary["integerArray"], classType: [Any].self, itemType: Int.self),
            let integerArrayList = validIntegerArray as? [Int] {
            self.integerArray = integerArrayList
        } else {
            self.integerArray = nil
        }
        if let validBooleanArray = try? NSObject.generateObject(data: dictionary["booleanArray"], classType: [Any].self, itemType: Bool.self),
            let booleanArrayList = validBooleanArray as? [Bool] {
            self.booleanArray = booleanArrayList
        } else {
            self.booleanArray = nil
        }

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [:] as [AnyHashable: Any]

        dict["name"] = self.name
        dict["version"] = self.version

        if let nonNullValue = self.value {
            dict["value"] = nonNullValue
        }
        if let nonNullDomain = self.domain {
            dict["domain"] = nonNullDomain
        }
        if let nonNullPath = self.path {
            dict["path"] = nonNullPath
        }
        if let nonNullUri = self.uri {
            dict["uri"] = nonNullUri
        }
        if let nonNullExpiry = self.expiry {
            dict["expiry"] = nonNullExpiry
        }
        if let nonNullLeftButton = self.leftButton {
            dict["leftButton"] = nonNullLeftButton.toDictionary()
        }
        if let nonNullRightButtons = self.rightButtons {
            dict["rightButtons"] = nonNullRightButtons.map { $0.toDictionary() }
        }
        if let nonNullIsGuestUser = self.isGuestUser {
            dict["isGuestUser"] = nonNullIsGuestUser
        }
        if let nonNullMergeType = self.mergeType {
            dict["mergeType"] = nonNullMergeType
        }
        if let nonNullStringArray = self.stringArray {
            dict["stringArray"] = nonNullStringArray
        }
        if let nonNullIntegerArray = self.integerArray {
            dict["integerArray"] = nonNullIntegerArray
        }
        if let nonNullBooleanArray = self.booleanArray {
            dict["booleanArray"] = nonNullBooleanArray
        }
        return dict as NSDictionary
    }
}
#endif
